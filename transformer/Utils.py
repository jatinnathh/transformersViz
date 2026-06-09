import torch
import numpy as np
from typing import List


def get_device() -> torch.device:
    """Returns the best available device: CUDA > MPS (Apple Silicon) > CPU."""
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def pad_left(sequence: List[int], final_length: int, padding_token: int) -> List[int]:
    """Left-pads a sequence to final_length with padding_token."""
    pad_len = final_length - len(sequence)
    return [padding_token] * max(pad_len, 0) + sequence[-final_length:]


def pad_right(sequence: List[int], final_length: int, padding_token: int) -> List[int]:
    """Right-pads a sequence to final_length with padding_token."""
    pad_len = final_length - len(sequence)
    return sequence[:final_length] + [padding_token] * max(pad_len, 0)


def create_training_sequences(
    tokenized_data: List[int],
    max_sequence_length: int
) -> List[List[int]]:
    """
    Sliding window over tokenized data.
    Each sequence is (max_sequence_length + 1) tokens:
    input = seq[:-1], target = seq[1:]  — handled by AutoregressiveWrapper.
    """
    sequences = []
    window = max_sequence_length + 1
    for i in range(len(tokenized_data) - window):
        sequences.append(tokenized_data[i : i + window])
    return sequences


def tokenize_and_pad_training_data(
    training_data: str,
    tokenizer,
    max_sequence_length: int
) -> List[int]:
    """
    Tokenizes raw text and prepends max_sequence_length padding tokens
    so the model sees a full context window from the very first token.
    """
    pad_id = tokenizer.character_to_token("<pad>")
    tokens = tokenizer.tokenize(training_data)
    return [pad_id] * max_sequence_length + tokens