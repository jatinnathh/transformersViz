import torch
from typing import Optional

from utils import get_device, pad_left


class Generator:
    """
    Autoregressive text generator.

    Supports three decoding strategies (can be combined):
      - Temperature:  scales logits before softmax
      - Top-k:        restricts sampling to k most likely tokens
      - Top-p:        nucleus sampling — samples from the smallest
                      set of tokens whose cumulative probability ≥ p

    Recommended settings:
      - Greedy (deterministic):  temperature=1.0, top_k=1
      - Balanced quality:        temperature=0.8, top_k=50, top_p=0.9
      - Creative/diverse:        temperature=1.0, top_k=0,  top_p=0.9
    """

    def __init__(self, model, tokenizer):
        self.model = model
        self.tokenizer = tokenizer
        self.device = get_device()

    @torch.no_grad()
    def generate(
        self,
        max_tokens_to_generate: int,
        prompt: Optional[str] = None,
        temperature: float = 0.8,
        top_k: int = 50,
        top_p: float = 0.9,
        eos_token: Optional[int] = None,
        padding_token: int = 0,
    ) -> str:
        """
        Generate text autoregressively.

        prompt:    seed text; if None starts from padding token
        top_k:     0 to disable
        top_p:     1.0 to disable
        eos_token: stops generation when this token is sampled
        """
        self.model.eval()
        pad_id = padding_token
        max_ctx = self.model.max_sequence_length

        # Build starting token sequence
        if prompt is None:
            start_tokens = [pad_id]
        else:
            start_tokens = self.tokenizer.tokenize(prompt)

        # Left-pad to fill the context window
        padded = pad_left(
            sequence=start_tokens,
            final_length=max_ctx + 1,
            padding_token=pad_id,
        )
        out = torch.tensor(padded, dtype=torch.long, device=self.device).unsqueeze(0)

        generated = []

        for _ in range(max_tokens_to_generate):
            # Use only the last max_ctx tokens as context
            context = out[:, -max_ctx:]
            mask = (context != pad_id)

            next_token_probs = self.model.next_token_probabilities(
                x=context,
                mask=mask,
                temperature=temperature,
                top_k=top_k,
                top_p=top_p,
            )

            next_token = torch.multinomial(next_token_probs, num_samples=1)
            token_id = next_token.item()
            generated.append(token_id)

            out = torch.cat([out, next_token], dim=1)

            if eos_token is not None and token_id == eos_token:
                break

        # Decode only the newly generated tokens (not the prompt padding)
        all_tokens = out[0].tolist()

        # Strip leading padding
        stripped = [t for t in all_tokens if t != pad_id]
        return "".join([self.tokenizer.token_to_character(t) for t in stripped])