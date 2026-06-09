import torch
import torch.nn as nn
import random
import math
import numpy as np
from typing import List, Optional

from utils import get_device


class Trainer:
    """
    Trainer with modern practices for small-dataset transformers:

      - AdamW optimiser (weight decay on weights, not biases/norms)
      - Cosine LR schedule with linear warmup
      - Gradient clipping (prevents exploding gradients)
      - Label smoothing (prevents overconfident predictions on small data)
    """

    def __init__(
        self,
        model: nn.Module,
        tokenizer,
        learning_rate: float = 3e-4,
        weight_decay: float = 0.1,
        warmup_steps: int = 100,
        label_smoothing: float = 0.1,
    ):
        self.model = model
        self.tokenizer = tokenizer
        self.device = get_device()

        # AdamW: decouples weight decay from gradient update
        # Only apply weight decay to weight matrices, not biases or LayerNorm params
        decay_params = [
            p for n, p in model.named_parameters()
            if p.requires_grad and p.dim() >= 2
        ]
        no_decay_params = [
            p for n, p in model.named_parameters()
            if p.requires_grad and p.dim() < 2
        ]
        self.optimizer = torch.optim.AdamW([
            {"params": decay_params, "weight_decay": weight_decay},
            {"params": no_decay_params, "weight_decay": 0.0},
        ], lr=learning_rate, betas=(0.9, 0.95), eps=1e-8)

        self.warmup_steps = warmup_steps
        self.current_step = 0

        # Label smoothing helps generalisation on small datasets
        # Instead of training toward hard 0/1 targets, it uses (ε/V) and (1-ε)
        pad_id = tokenizer.character_to_token("<pad>")
        self.loss_fn = nn.CrossEntropyLoss(
            ignore_index=pad_id,
            label_smoothing=label_smoothing,
        )

    def _lr_schedule(self, total_steps: int) -> float:
        """
        Linear warmup then cosine decay.
        Warmup prevents early large updates from destroying random init.
        Cosine decay is smoother than step/linear decay.
        """
        if self.current_step < self.warmup_steps:
            return self.current_step / max(1, self.warmup_steps)
        progress = (self.current_step - self.warmup_steps) / max(1, total_steps - self.warmup_steps)
        return 0.1 + 0.9 * 0.5 * (1.0 + math.cos(math.pi * progress))

    def _set_lr(self, total_steps: int):
        scale = self._lr_schedule(total_steps)
        for group in self.optimizer.param_groups:
            group["lr"] = group.get("base_lr", 3e-4) * scale

    def train(
        self,
        sequences: List[List[int]],
        epochs: int,
        batch_size: int,
        log_every: int = 10,
    ) -> List[float]:
        """
        Train the model.

        sequences: list of token-id lists, each length (max_seq_len + 1)
        returns:   loss per epoch
        """
        # Store base LR for scheduler
        for group in self.optimizer.param_groups:
            group["base_lr"] = group["lr"]

        total_steps = (len(sequences) // batch_size) * epochs
        loss_per_epoch = []
        pad_id = self.tokenizer.character_to_token("<pad>")

        for epoch in range(epochs):
            self.model.train()
            random.shuffle(sequences)
            epoch_losses = []

            for i in range(0, len(sequences) - batch_size + 1, batch_size):
                batch = sequences[i : i + batch_size]
                seq_tensor = torch.tensor(batch, dtype=torch.long).to(self.device)

                # Mask: 1 for real tokens, 0 for padding
                mask = (seq_tensor != pad_id).long()

                # Forward
                logits, targets = self.model(seq_tensor, mask)

                # Loss: (batch, vocab, seq) vs (batch, seq)
                loss = self.loss_fn(logits.transpose(1, 2), targets)

                # Backward
                self.optimizer.zero_grad()
                loss.backward()

                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

                # LR schedule step
                self._set_lr(total_steps)
                self.optimizer.step()
                self.current_step += 1

                epoch_losses.append(loss.item())

            epoch_loss = float(np.mean(epoch_losses))
            loss_per_epoch.append(epoch_loss)

            if epoch % log_every == 0 or epoch == epochs - 1:
                current_lr = self.optimizer.param_groups[0]["lr"]
                print(f"Epoch {epoch:4d} | Loss {epoch_loss:.4f} | LR {current_lr:.2e}")

        return loss_per_epoch