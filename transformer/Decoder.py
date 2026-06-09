import torch
import torch.nn as nn
from MaskedMultiHeadAttention import MaskedMultiHeadedAttention
from FeedForward import FeedForward


class DecoderLayer(nn.Module):
    """
    Single GPT-style decoder layer (decoder-only, no cross-attention).

    Architecture — Pre-LN:
        x = x + Attention(LayerNorm(x))
        x = x + FFN(LayerNorm(x))

    Pre-LN is more stable than Post-LN on small datasets because
    gradients don't vanish through unnormalised residual paths.

    Input/output: (batch_size, sequence_length, embedding_dimension)
    """

    def __init__(
        self,
        embedding_dimension: int,
        number_of_heads: int,
        feed_forward_dimension: int = None,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.attention = MaskedMultiHeadedAttention(
            embedding_dimension, number_of_heads, dropout
        )
        self.ffn = FeedForward(embedding_dimension, feed_forward_dimension, dropout)

        self.norm1 = nn.LayerNorm(embedding_dimension)
        self.norm2 = nn.LayerNorm(embedding_dimension)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        # Pre-LN attention + residual
        x = x + self.dropout(self.attention(self.norm1(x), mask))
        # Pre-LN FFN + residual
        x = x + self.dropout(self.ffn(self.norm2(x)))
        return x


class DecoderStack(nn.Module):
    """
    Stack of N DecoderLayer modules.

    Also applies a final LayerNorm after all layers (required by Pre-LN
    architecture — without it the last layer's output is unnormalised).
    """

    def __init__(
        self,
        embedding_dimension: int,
        number_of_layers: int,
        number_of_heads: int,
        feed_forward_dimension: int = None,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.layers = nn.ModuleList([
            DecoderLayer(embedding_dimension, number_of_heads, feed_forward_dimension, dropout)
            for _ in range(number_of_layers)
        ])
        # Final norm — essential for Pre-LN transformers
        self.final_norm = nn.LayerNorm(embedding_dimension)

    def forward(self, x: torch.Tensor, mask: torch.Tensor = None) -> torch.Tensor:
        for layer in self.layers:
            x = layer(x, mask)
        return self.final_norm(x)