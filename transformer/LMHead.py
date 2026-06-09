import torch
import torch.nn as nn


class LMHead(nn.Module):
    """
    Language model head: projects embedding_dimension → vocabulary logits.

    Weight tying: shares weights with the token embedding matrix.
    This is standard in modern LLMs (GPT-2, LLaMA) — it:
      - Reduces parameters significantly (embedding table is large)
      - Improves performance because the output space mirrors the input space
      - Regularises training on small datasets

    Pass the embedding weight via tie_weights() after construction.
    """

    def __init__(self, embedding_dimension: int, number_of_tokens: int):
        super().__init__()
        self.projection = nn.Linear(embedding_dimension, number_of_tokens, bias=False)

    def tie_weights(self, embedding_weight: torch.Tensor):
        """
        Share weights with the token embedding layer.
        Call this once after constructing the full model:
            lm_head.tie_weights(token_embedding.embedding.weight)
        """
        self.projection.weight = nn.Parameter(embedding_weight)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x:      (batch, seq_len, embedding_dimension)
        output: (batch, seq_len, number_of_tokens)  — raw logits, no softmax
        """
        return self.projection(x)