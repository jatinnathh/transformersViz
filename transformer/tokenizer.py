import torch

class TokenEmbedding(torch.nn.module):
    "pytorch module that converts tokens to embeddings"

    def __init__(self,d_model,tokens):
        super().__init__()
        self.embedding_layer=torch.nn.embedding(
            num_embeddings=tokens,
            embedding_dim=d_model
        )

    def forward(self,x):
        return self.embedding_layer()

