import torch
import torch.nn as nn
from MaskedMultiheadAttention import MaskedMultiHeadedAttention
from FeedForward import FeedForward
from TokenEmbedding import TokenEmbedding
class TransformerEncoderLayer(nn.Module):
    """
    Single transformer encoder layer.

    Pre-LN ordering (layer norm before each sublayer) for training stability.
    Architecture: Pre-LN → Attention → residual, Pre-LN → FFN → residual

    Input/output shape: (batch_size, sequence_length, embedding_dimension)
    """
    def __init__(self, embedding_dimension, number_of_heads,
                 feed_forward_dimension=None, dropout=0.1):
        super().__init__()

        self.attention = MaskedMultiHeadedAttention(
            embedding_dimension, number_of_heads, dropout
        )
        self.ffn = FeedForward(embedding_dimension, feed_forward_dimension, dropout)

        # One norm before attention, one before FFN
        self.norm1 = nn.LayerNorm(embedding_dimension)
        self.norm2 = nn.LayerNorm(embedding_dimension)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # Pre-LN attention block with residual
        x = x + self.dropout(self.attention(self.norm1(x), mask))

        # Pre-LN FFN block with residual
        x = x + self.dropout(self.ffn(self.norm2(x)))

        return x
class TransformerEncoder(nn.Module):
    """
    Stack of N encoder layers with token embedding.
    RoPE is handled inside each attention layer — no separate positional encoding step.
    """
    def __init__(self, vocab_size, embedding_dimension, number_of_heads,
                 num_layers, feed_forward_dimension=None, dropout=0.1,
                 max_sequence_length=2048):
        super().__init__()
        self.embedding = TokenEmbedding(embedding_dimension, vocab_size)
        self.dropout = nn.Dropout(dropout)
        self.layers = nn.ModuleList([
            TransformerEncoderLayer(
                embedding_dimension, number_of_heads,
                feed_forward_dimension, dropout
            )
            for _ in range(num_layers)
        ])
        self.norm = nn.LayerNorm(embedding_dimension)  # final norm (Pre-LN style)

    def forward(self, x, mask=None):
        # x: (batch, seq_len) token ids
        x = self.dropout(self.embedding(x))

        for layer in self.layers:
            x = layer(x, mask)

        return self.norm(x)  # final LayerNorm before output