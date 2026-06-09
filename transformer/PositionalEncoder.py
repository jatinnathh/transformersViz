import torch
import torch.nn as nn



class RotatoryPositionalEmbedding(nn.Module):
    """
    RoPE (Rotary Position Embedding) — encodes position by rotating
    query/key vectors in 2D subspaces rather than adding a fixed offset
    to embeddings. Position information is baked in at attention time,
    not at the embedding level.
    """
    def __init__(self,d_model,max_sequence_length=2048,base=10000):
        super().__init__()
        
        self.d_model=d_model
        self.max_sequence_length=max_sequence_length
        self.base=base

        cos,sin=self._build_cache(max_sequence_length)
        self.register_buffer("cos_cached",cos)
        self.register_buffer("sin_cached",sin)

    
    def _build_cache(self, seq_len):
        """
        Precomputes cos and sin tables of shape (seq_len, d_model // 2).
        Each pair of dimensions (2i, 2i+1) shares one frequency theta_i.
        """
        # theta_i = 1 / (base ^ (2i / d_model)), for i in [0, d_model/2)
        i = torch.arange(0, self.d_model, 2, dtype=torch.float32)
        theta = 1.0 / (self.base ** (i / self.d_model))          # (d_model/2,)

        positions = torch.arange(seq_len, dtype=torch.float32)   # (seq_len,)
        freqs = torch.outer(positions, theta)                     # (seq_len, d_model/2)

        return freqs.cos(), freqs.sin()


    @staticmethod
    def _rotate_half(x):
        """
        Splits x into two halves along the last dim and returns
        [-x2, x1], which is the 90-degree rotation partner needed
        for the complex multiplication trick.
        """
        x1 = x[..., : x.shape[-1] // 2]
        x2 = x[..., x.shape[-1] // 2 :]
        return torch.cat([-x2, x1], dim=-1)

    def rotate(self, x):
        """
        Applies RoPE rotation to a tensor x of shape (batch, seq_len, d_model).
        Call this on both your query and key tensors before computing attention.
        """
        seq_len = x.size(-2)
        cos = torch.cat([self.cos_cached[:seq_len],
                        self.cos_cached[:seq_len]], dim=-1).to(x.device)  # ← add .to(x.device)
        sin = torch.cat([self.sin_cached[:seq_len],
                        self.sin_cached[:seq_len]], dim=-1).to(x.device)  # ← add .to(x.device)

        cos = cos.unsqueeze(0).unsqueeze(0)
        sin = sin.unsqueeze(0).unsqueeze(0)

        return x * cos + self._rotate_half(x) * sin

    def forward(self, x):
        """
        For drop-in compatibility with the old PositionalEncoding interface.
        Rotates the input directly (treats it as queries/keys).
        In a real transformer, call .rotate(q) and .rotate(k) separately
        on your query and key projections instead.
        """
        return self.rotate(x)