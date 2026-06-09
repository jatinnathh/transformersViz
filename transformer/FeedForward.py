import torch
import torch.nn as nn
import torch.nn.functional as F

class FeedForward(nn.Module):
    """
    FFN with SwiGLU activation — used in LLaMA, Mistral, PaLM.
    
    SwiGLU: FFN(x) = (Swish(W1·x) ⊙ W3·x) · W2
    
    The hidden dimension is set to 2/3 of 4*d_model to keep parameter
    count roughly equal to a standard ReLU FFN with 4*d_model hidden units.
    """
    def __init__(self, embedding_dimension, feed_forward_dimension=None, dropout=0.1):
        super().__init__()
        # If not specified, follow the LLaMA convention
        if feed_forward_dimension is None:
            feed_forward_dimension = int(2/3 * 4 * embedding_dimension)
            # Round to nearest multiple of 256 for hardware efficiency
            feed_forward_dimension = 64 * ((feed_forward_dimension + 63) // 64)

        self.w1 = nn.Linear(embedding_dimension, feed_forward_dimension, bias=False)
        self.w2 = nn.Linear(feed_forward_dimension, embedding_dimension, bias=False)
        self.w3 = nn.Linear(embedding_dimension, feed_forward_dimension, bias=False)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # Gate: element-wise product of SiLU(W1·x) and W3·x
        return self.dropout(self.w2(F.silu(self.w1(x)) * self.w3(x)))