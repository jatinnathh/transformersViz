import datetime
import datetime
import datetime
import torch
import math

class MaskedSelfAttention(torch.nn.Module):
    """
    Pytorch module for a self attention layer.
    This layer is used in the MultiHeadedSelfAttention module.

    Input dimension is: (batch_size, sequence_length, embedding_dimension)
    Output dimension is: (batch_size, sequence_length, head_dimension)
    """
    def __init__(self,embedding_dimension,head_dimension,dropout=0.1):
        super().__init__()
        self.head_dimension=head_dimension

        self.k_linear=torch.nn.Linear(embedding_dimension,self.head_dimension)
        self.v_linear=torch.nn.Linear(embedding_dimension,self.head_dimension)
        self.q_linear=torch.nn.Linear(embedding_dimension,self.head_dimension)
        self.dropout=torch.nn.Dropout(dropout)
        self.softmax=torch.nn.Softmax(dim=-1)

    def causal_mask(self,seq_len,device):
        return torch.triu(
            torch.full((seq_len, seq_len), -1e9, device=device), diagonal=1
        ) 
    def forward(self,x,mask=None):
        query=self.q_linear(x)
        key=self.k_linear(x)
        value=self.v_linear(x)

        attention_weights=torch.matmul(query,key.transpose(-2,-1))
        attention_weights=attention_weights/math.sqrt(self.head_dimension) 
        

        attention_weights=attention_weights+self.causal_mask(x.size(1),x.device) 

        if mask is not None:
            attention_weights=attention_weights.masked_fill(mask.unsqueeze(1)==0,-1e9)
        
        attention_scores=self.dropout(self.softmax(attention_weights))
        return torch.matmul(attention_scores,value)