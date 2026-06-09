import torch
import torch.nn as nn
from positionalencoder import RotatoryPositionalEmbedding
class MaskedMultiHeadedAttention(nn.Module):
    def __init__(self,rope,embedding_dimension,number_of_heads,dropout=0.1):
        self.rope = RotatoryPositionalEmbedding(self.head_dimension)
        super().__init__()
        assert embedding_dimension % number_of_heads == 0, \
                "embedding_dimension must be divisible by number_of_heads"
        self.embedding_dim=embedding_dimension
        self.number_of_heads=number_of_heads
        self.head_dimension=embedding_dimension//number_of_heads

        # Single projection for all heads at once
        self.query_layer = torch.nn.Linear(embedding_dimension, embedding_dimension)
        self.key_layer   = torch.nn.Linear(embedding_dimension, embedding_dimension)
        self.value_layer = torch.nn.Linear(embedding_dimension, embedding_dimension)
        self.output_layer = torch.nn.Linear(embedding_dimension, embedding_dimension)
        self.dropout = torch.nn.Dropout(dropout)

    def _causal_mask(self, seq_len, device):
        return torch.triu(
            torch.full((seq_len, seq_len), -1e9, device=device), diagonal=1
        )

    def forward(self, x, mask=None):
        """
        Compute the multi head attention.

        x dimensions are: (batch_size, sequence_length, embedding_dimension)
        mask dimensions are: (batch_size, sequence_length)
        mask values are: 0 or 1. 0 means the token is masked, 1 means the token is not masked.
        """
        B, S, E = x.shape
        H = self.number_of_heads
        D = self.head_dimension

        # Project and reshape into (batch, heads, seq_len, head_dim)
        Q = self.query_layer(x).view(B, S, H, D).transpose(1, 2)
        K = self.key_layer(x).view(B, S, H, D).transpose(1, 2)
        V = self.value_layer(x).view(B, S, H, D).transpose(1, 2)

        Q = self.rope.rotate(Q)   # Q shape: (batch, heads, seq, head_dim)
        K = self.rope.rotate(K)

        # Attention weights: (batch, heads, seq_len, seq_len)
        weights = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(D)

        # Causal mask
        weights = weights + self._causal_mask(S, x.device)

        # Padding mask: (batch, 1, 1, seq_len) broadcasts over heads and query positions
        if mask is not None:
            weights = weights.masked_fill(mask.unsqueeze(1).unsqueeze(2) == 0, -1e9)

        scores = self.dropout(torch.softmax(weights, dim=-1))

        # (batch, heads, seq, head_dim) → (batch, seq, embedding_dim)
        out = torch.matmul(scores, V)
        out = out.transpose(1, 2).contiguous().view(B, S, E)

        return self.output_layer(out)