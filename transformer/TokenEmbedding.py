import torch
import math

class TokenEmbedding(torch.nn.Module):
    def __init__(self, d_model, vocab_size):
        super().__init__()                          # ← required
        self.d_model = d_model
        self.embedding = torch.nn.Embedding(
            num_embeddings=vocab_size,
            embedding_dim=d_model,
            padding_idx=0
        )

    def forward(self, x):
        return self.embedding(x) * math.sqrt(self.d_model)