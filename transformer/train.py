import sys
import os
import os
os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":4096:8"
import torch
torch.backends.cuda.matmul.allow_tf32 = False  # disable TF32 — causes silent bugs on some 30-series
torch.use_deterministic_algorithms(False)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import torch
import matplotlib.pyplot as plt

from Tokenizer import Tokenizer
from LanguageModel import LanguageModel, AutoregressiveWrapper
from Trainer import Trainer
from utils import get_device, create_training_sequences, tokenize_and_pad_training_data

# ── Config ────────────────────────────────────────────────────────────────────

DATASET_PATH        = "dataset.txt"
CHECKPOINT_PATH     = "./trained_model"

MAX_SEQUENCE_LENGTH = 128     
EMBEDDING_DIM       = 256   
NUMBER_OF_HEADS     = 4
NUMBER_OF_LAYERS    = 4
DROPOUT             = 0.1

EPOCHS              = 50     
BATCH_SIZE          = 64
LEARNING_RATE       = 3e-4
WARMUP_STEPS        = 200

# ── Load dataset ──────────────────────────────────────────────────────────────

print(f"Device: {get_device()}")
torch.backends.cudnn.benchmark = True
print(torch.cuda.get_device_name(0))
print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
print(f"Loading dataset from {DATASET_PATH}...")

with open(DATASET_PATH, "r", encoding="utf-8") as f:
    raw_text = f.read()

# Optional: trim to first N characters for a quick smoke test
# raw_text = raw_text[:200_000]

print(f"Dataset size: {len(raw_text):,} characters")

# ── Tokenizer ─────────────────────────────────────────────────────────────────

tokenizer = Tokenizer()
print(f"Vocabulary size: {tokenizer.size()} tokens")

# ── Prepare sequences ─────────────────────────────────────────────────────────

tokenized = tokenize_and_pad_training_data(raw_text, tokenizer, MAX_SEQUENCE_LENGTH)
sequences = create_training_sequences(tokenized, MAX_SEQUENCE_LENGTH, stride=32)
print(f"Training sequences: {len(sequences):,}")

# ── Build model ───────────────────────────────────────────────────────────────

model = AutoregressiveWrapper(
    LanguageModel(
        number_of_tokens    = tokenizer.size(),
        max_sequence_length = MAX_SEQUENCE_LENGTH,
        embedding_dimension = EMBEDDING_DIM,
        number_of_heads     = NUMBER_OF_HEADS,
        number_of_layers    = NUMBER_OF_LAYERS,
        dropout             = DROPOUT,
    )
).to(get_device())

total_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Model parameters: {total_params:,}")

# ── Train ─────────────────────────────────────────────────────────────────────

trainer = Trainer(
    model           = model,
    tokenizer       = tokenizer,
    learning_rate   = LEARNING_RATE,
    warmup_steps    = WARMUP_STEPS,
    label_smoothing = 0.1,
)

print(f"\nTraining for {EPOCHS} epochs...\n")
loss_per_epoch = trainer.train(sequences, epochs=EPOCHS, batch_size=BATCH_SIZE)

# ── Save ──────────────────────────────────────────────────────────────────────

model.save_checkpoint(CHECKPOINT_PATH)
print(f"\nCheckpoint saved to {CHECKPOINT_PATH}")

# ── Plot loss ─────────────────────────────────────────────────────────────────

plt.figure(figsize=(10, 4))
plt.plot(loss_per_epoch)
plt.yscale("log")
plt.xlabel("Epoch")
plt.ylabel("Loss (log scale)")
plt.title("Training loss")
plt.tight_layout()
plt.savefig("loss_curve.png")
plt.show()
print("Loss curve saved to loss_curve.png")

# ── Quick generation test ─────────────────────────────────────────────────────

from Generator import Generator

print("\n── Sample generations ──")
generator = Generator(model, tokenizer)

for prompt in ["First Citizen", "All:", "Before we"]:
    out = generator.generate(
        max_tokens_to_generate = 80,
        prompt                 = prompt,
        temperature            = 0.8,
        top_k                  = 50,
        top_p                  = 0.9,
        padding_token          = tokenizer.character_to_token("<pad>"),
    )
    print(f"\nPrompt: '{prompt}'")
    print(f"Output: {out}")