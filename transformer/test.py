import sys
import os
os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":4096:8"
import torch
torch.backends.cuda.matmul.allow_tf32 = False  # disable TF32 — causes silent bugs on some 30-series
torch.use_deterministic_algorithms(False)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from Tokenizer import Tokenizer
from LanguageModel import AutoregressiveWrapper
from Generator import Generator

# -- Load model and tokenizer --------------------------------------------------

CHECKPOINT_PATH = "./trained_model"
tokenizer = Tokenizer()

print(f"Loading model checkpoint from {CHECKPOINT_PATH}...")
model = AutoregressiveWrapper.load_checkpoint(CHECKPOINT_PATH)

# -- Interactive generation test -----------------------------------------------

print("\n-- Interactive generation --")
print("Enter your prompts below. Type 'exit' or 'quit' to stop.")
generator = Generator(model, tokenizer)

while True:
    try:
        prompt = input("\nEnter prompt: ")
    except (KeyboardInterrupt, EOFError):
        print("\nExiting...")
        break
    
    if prompt.strip().lower() in ["exit", "quit"]:
        print("Exiting...")
        break
        
    if not prompt.strip():
        continue

    out = generator.generate(
        max_tokens_to_generate = 80,
        prompt                 = prompt,
        temperature            = 0.8,
        top_k                  = 50,
        top_p                  = 0.9,
        padding_token          = tokenizer.character_to_token("<pad>"),
    )
    
    try:
        print(f"Output: {out}")
    except UnicodeEncodeError:
        print(f"Output: {out.encode('utf-8', errors='replace').decode('ascii', errors='replace')}")

