import torch
import torch.nn as nn
from typing import Optional

from TokenEmbedding import TokenEmbedding
from Decoder import DecoderStack
from LMHead import LMHead
from utils import get_device


class LanguageModel(nn.Module):
    """
    GPT-style decoder-only language model.

    Improvements over the reference implementation:
      - RoPE is handled inside attention (no separate positional encoding step)
      - Weight tying between token embedding and LM head
      - Pre-LN throughout (via DecoderStack)
      - SwiGLU FFN (via FeedForward)
      - No post-embedding LayerNorm (redundant with Pre-LN + embedding scaling)
    """

    def __init__(
        self,
        number_of_tokens: int,
        max_sequence_length: int = 512,
        embedding_dimension: int = 512,
        number_of_layers: int = 6,
        number_of_heads: int = 8,
        feed_forward_dimension: int = None,
        dropout: float = 0.1,
    ):
        super().__init__()
        assert embedding_dimension % number_of_heads == 0, \
            "embedding_dimension must be divisible by number_of_heads"

        self.number_of_tokens = number_of_tokens
        self.max_sequence_length = max_sequence_length
        self.embedding_dimension = embedding_dimension
        self.number_of_layers = number_of_layers
        self.number_of_heads = number_of_heads
        self.feed_forward_dimension = feed_forward_dimension
        self.dropout_rate = dropout

        self.token_embedding = TokenEmbedding(embedding_dimension, number_of_tokens)
        self.dropout = nn.Dropout(dropout)

        self.decoder = DecoderStack(
            embedding_dimension=embedding_dimension,
            number_of_layers=number_of_layers,
            number_of_heads=number_of_heads,
            feed_forward_dimension=feed_forward_dimension,
            dropout=dropout,
        )

        self.lm_head = LMHead(embedding_dimension, number_of_tokens)

        # Weight tying: LM head shares the embedding matrix
        # Cuts parameters and improves generalisation on small data
        self.lm_head.tie_weights(self.token_embedding.embedding.weight)

        # Initialise weights (GPT-2 style)
        self.apply(self._init_weights)

    def _init_weights(self, module: nn.Module):
        """
        GPT-2 weight initialisation:
          - Linear and Embedding: N(0, 0.02)
          - Residual projections scaled by 1/√(2 * n_layers) to prevent
            variance blowup through deep residual stacks
        """
        if isinstance(module, (nn.Linear, nn.Embedding)):
            nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if hasattr(module, "bias") and module.bias is not None:
                nn.init.zeros_(module.bias)

    def forward(
        self,
        x: torch.Tensor,
        mask: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        x:    (batch, seq_len) — token ids
        mask: (batch, seq_len) — 1 = real token, 0 = padding
        returns: (batch, seq_len, number_of_tokens) — logits
        """
        # Embed tokens (scaled by √d_model inside TokenEmbedding)
        x = self.dropout(self.token_embedding(x))

        # Decode — RoPE applied inside each attention layer
        x = self.decoder(x, mask)

        # Project to vocabulary
        return self.lm_head(x)

    def save_checkpoint(self, path: str):
        print(f"Saving checkpoint → {path}")
        torch.save({
            "number_of_tokens": self.number_of_tokens,
            "max_sequence_length": self.max_sequence_length,
            "embedding_dimension": self.embedding_dimension,
            "number_of_layers": self.number_of_layers,
            "number_of_heads": self.number_of_heads,
            "feed_forward_dimension": self.feed_forward_dimension,
            "dropout_rate": self.dropout_rate,
            "model_state_dict": self.state_dict(),
        }, path)

    @staticmethod
    def load_checkpoint(path: str) -> "LanguageModel":
        checkpoint = torch.load(path, map_location=get_device())
        model = LanguageModel(
            number_of_tokens=checkpoint["number_of_tokens"],
            max_sequence_length=checkpoint["max_sequence_length"],
            embedding_dimension=checkpoint["embedding_dimension"],
            number_of_layers=checkpoint["number_of_layers"],
            number_of_heads=checkpoint["number_of_heads"],
            feed_forward_dimension=checkpoint["feed_forward_dimension"],
            dropout=checkpoint["dropout_rate"],
        )
        model.load_state_dict(checkpoint["model_state_dict"])
        return model.to(get_device())


class AutoregressiveWrapper(nn.Module):
    """
    Wraps LanguageModel for autoregressive training and generation.

    During training:
        input  = x[:, :-1]   (all tokens except last)
        target = x[:, 1:]    (all tokens except first)
    This teaches the model to predict the next token at every position.
    """

    def __init__(self, model: LanguageModel):
        super().__init__()
        self.model = model
        self.max_sequence_length = model.max_sequence_length

    def forward(self, x: torch.Tensor, mask: torch.Tensor):
        """
        Returns (logits, targets) for loss computation.
        logits:  (batch, seq_len-1, vocab)
        targets: (batch, seq_len-1)
        """
        inp, target = x[:, :-1], x[:, 1:]
        mask = mask[:, :-1]
        logits = self.model(inp, mask)
        return logits, target

    @torch.no_grad()
    def next_token_probabilities(
        self,
        x: torch.Tensor,
        mask: torch.Tensor,
        temperature: float = 1.0,
        top_k: int = 0,
        top_p: float = 1.0,
    ) -> torch.Tensor:
        """
        Returns probability distribution over the next token.

        temperature: >1 = more random, <1 = more greedy
        top_k:  keep only the k highest-probability tokens (0 = disabled)
        top_p:  nucleus sampling — keep smallest set whose cumulative
                probability exceeds p (1.0 = disabled)
        """
        logits = self.model(x, mask)[:, -1]  # (batch, vocab)

        # Temperature
        if temperature != 1.0:
            logits = logits / temperature

        # Top-k filtering
        if top_k > 0:
            top_k = min(top_k, logits.size(-1))
            threshold = logits.topk(top_k).values[..., -1, None]
            logits = logits.masked_fill(logits < threshold, -float("inf"))

        # Top-p (nucleus) filtering
        if top_p < 1.0:
            sorted_logits, sorted_idx = torch.sort(logits, descending=True)
            cumulative_probs = torch.cumsum(torch.softmax(sorted_logits, dim=-1), dim=-1)
            # Remove tokens once cumulative prob exceeds top_p
            sorted_idx_to_remove = cumulative_probs - torch.softmax(sorted_logits, dim=-1) > top_p
            sorted_logits[sorted_idx_to_remove] = -float("inf")
            logits = torch.zeros_like(logits).scatter_(1, sorted_idx, sorted_logits)

        return torch.softmax(logits, dim=-1)

    def save_checkpoint(self, path: str):
        self.model.save_checkpoint(path)

    @staticmethod
    def load_checkpoint(path: str) -> "AutoregressiveWrapper":
        model = LanguageModel.load_checkpoint(path)
        return AutoregressiveWrapper(model).to(get_device())