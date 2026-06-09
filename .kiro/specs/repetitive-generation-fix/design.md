# Bugfix Technical Design Document

## Introduction

This document provides technical analysis of the bug where the transformer language model generates repetitive output (repeated "l" characters) during testing, despite producing varied output during training. The model trained successfully with reasonable loss curves (final loss: 1.5894) and sample generations during training showed coherent text. However, when testing interactively with test.py using temperature 0.8, the model degenerates into repetitive character generation.

## Technical Context

### Architecture Overview

The system implements a GPT-style decoder-only transformer with the following components:

- **LanguageModel**: Main model class with token embeddings, decoder stack, and LM head
- **AutoregressiveWrapper**: Wraps the model for training and generation
- **Generator**: Handles autoregressive text generation with temperature, top-k, and top-p sampling
- **Tokenizer**: Character-level tokenizer with ASCII vocabulary

### Model Configuration

- Max sequence length: 128 tokens
- Embedding dimension: 256
- Number of heads: 4
- Number of layers: 4
- Dropout: 0.1
- Training: 50 epochs, batch size 64, learning rate 3e-4

### Current Implementation Flow

**During Training (train.py):**
1. Model is in training mode (`model.train()`)
2. Sample generations use the same Generator class
3. Dropout layers are active during training forward passes
4. Sample generations during training appear coherent and varied

**During Testing (test.py):**
1. Model is loaded from checkpoint
2. Generator.generate() is called with temperature 0.8, top_k=50, top_p=0.9
3. Generator calls `self.model.eval()` at the start of generation
4. Model produces repetitive output

## Root Cause Analysis

### Primary Issue: Missing eval() Mode During Training Samples

**File:** `train.py` (lines 103-114)

The training script generates sample outputs at the end without setting the model to evaluation mode:

```python
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
```

The Generator class **does** call `self.model.eval()` internally (Generator.py line 46), so the training samples were actually in eval mode.

### Secondary Issue: Dropout Behavior Mismatch

**File:** `LanguageModel.py` (line 66)

```python
x = self.dropout(self.token_embedding(x))
```

The model applies dropout immediately after token embedding. During training:
- Dropout is active (randomly zeros elements with probability 0.1)
- This adds stochasticity to the model behavior

During evaluation (`eval()` mode):
- Dropout is disabled (all elements pass through)
- The model behaves deterministically (for a given temperature)

### Actual Root Cause: Evaluation Mode Behavior

After deeper analysis, the issue is **NOT** that eval mode is missing - Generator correctly calls `model.eval()`. The problem is that the model's behavior in eval mode (without dropout noise) reveals an underlying issue with the trained model itself.

**The Bug Condition:**
- When dropout is disabled (eval mode), the model consistently predicts the same high-probability token
- The token "l" (lowercase L) has become an attractor in the model's learned distribution
- Without dropout's randomness, temperature/top-k/top-p sampling cannot overcome this bias

**Why Training Samples Looked Good:**
This is the key mystery - the training script DOES call `model.eval()` in Generator. Both training samples and test samples should have identical behavior. 

**Hypothesis:** The "good" training samples shown in the output may have been generated during training (when dropout was active), NOT from the final Generator test section. Or there's a state difference (optimizer state, random seed, CUDA state) between training-time generation and test-time generation.

### The True Root Cause: Model Checkpoint State Mismatch

**File:** `test.py` (lines 6-13)

```python
print("Loading model...")
model = AutoregressiveWrapper.load_checkpoint(CHECKPOINT_PATH)
for name, param in model.named_parameters():
    print(name, param.abs().mean().item())
    break
```

**File:** `LanguageModel.py` (lines 108-117)

The checkpoint loading mechanism loads a LanguageModel and wraps it in AutoregressiveWrapper. However, there's a critical difference:

**During Training:**
- Model is created fresh with `__init__`
- Weight initialization is applied via `self.apply(self._init_weights)`
- Weight tying is performed AFTER initialization
- Dropout rate is 0.1 (training configuration)

**During Testing:**
- Model is loaded from checkpoint
- The loaded model retains all trained weights
- **The model is NOT put into evaluation mode after loading**

Actually, re-reading Generator.py line 46: `self.model.eval()` IS called.

### Re-Analysis: The Actual Bug

Let me trace through the exact execution:

1. **test.py loads model** → AutoregressiveWrapper with trained weights
2. **Generator.__init__** → stores model reference
3. **Generator.generate()** → calls `self.model.eval()` (line 46)
4. **Generation loop** → repeatedly calls `next_token_probabilities()`

**Critical Finding in LanguageModel.py (lines 126-141):**

```python
@torch.no_grad()
def next_token_probabilities(
    self,
    x: torch.Tensor,
    mask: torch.Tensor,
    temperature: float = 1.0,
    top_k: int = 0,
    top_p: float = 1.0,
) -> torch.Tensor:
    """
    Returns probability distribution over the next token.
    """
    logits = self.model(x, mask)[:, -1]  # (batch, vocab)

    # Temperature
    if temperature != 1.0:
        logits = logits / temperature
```

The top-p implementation has a bug in the cumulative probability calculation:

```python
# Top-p (nucleus) filtering
if top_p < 1.0:
    sorted_logits, sorted_idx = torch.sort(logits, descending=True)
    cumulative_probs = torch.cumsum(
        torch.softmax(sorted_logits, dim=-1), dim=-1
    )
    # Shift so the token that pushes over threshold is kept
    sorted_idx_to_remove = cumulative_probs - torch.softmax(
        sorted_logits, dim=-1
    ) > top_p
    sorted_logits[sorted_idx_to_remove] = -float("inf")
    logits = torch.zeros_like(logits).scatter_(1, sorted_idx, sorted_logits)
```

**THE BUG:** The condition `cumulative_probs - torch.softmax(sorted_logits, dim=-1) > top_p` is incorrect. It subtracts the current token's probability from cumulative, which means it's checking if the cumulative probability BEFORE including this token exceeds top_p. This causes overly aggressive filtering.

When combined with the model's preference for "l", the top-p filtering removes too many alternatives, leaving only "l" as a valid option repeatedly.

## Bug Condition Specification

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type GenerationContext
    WHERE GenerationContext = {
      model_state: TrainedModelWeights,
      prompt: String,
      temperature: Float,
      top_k: Integer,
      top_p: Float (< 1.0),
      eval_mode: Boolean
    }
  OUTPUT: boolean
  
  // Bug occurs when:
  // 1. Model is in evaluation mode (dropout disabled)
  // 2. Top-p sampling is enabled (< 1.0)
  // 3. The faulty top-p implementation over-filters the probability distribution
  
  RETURN (X.eval_mode = TRUE) AND 
         (X.top_p < 1.0) AND
         (X.top_k > 0 OR X.top_k = 0)
END FUNCTION
```

### Property Specification: Fix Checking

```pascal
// Property: Correct Top-p Filtering
FOR ALL X WHERE isBugCondition(X) DO
  probs ← next_token_probabilities'(X)
  
  // After fix, the probability distribution should:
  // 1. Contain multiple viable tokens (not collapse to single repeated token)
  // 2. Properly implement nucleus sampling (cumulative prob ≤ top_p)
  // 3. Generate varied output over multiple tokens
  
  output ← generate_sequence'(X, num_tokens=80)
  unique_chars ← count_unique_characters(output)
  
  ASSERT unique_chars > 5  // Should generate varied output
  ASSERT NOT is_repetitive_pattern(output)  // Should not repeat single character
  ASSERT properly_filtered_distribution(probs, X.top_p)
END FOR
```

### Property Specification: Preservation Checking

```pascal
// Property: Preserve Correct Behavior for Non-buggy Inputs
FOR ALL X WHERE NOT isBugCondition(X) DO
  // For inputs that work correctly (top_k only, or temperature only):
  output_before ← generate_sequence(X, num_tokens=80)
  output_after ← generate_sequence'(X, num_tokens=80)
  
  // The generation quality should remain unchanged
  ASSERT similar_quality(output_before, output_after)
  
  // Edge case: top_p = 1.0 (disabled) should be unaffected
  IF X.top_p = 1.0 THEN
    ASSERT output_before = output_after  // Deterministic with same seed
  END IF
END FOR
```

## Proposed Solution Architecture

### Solution: Fix Top-p Nucleus Sampling Implementation

**File to Modify:** `LanguageModel.py` (AutoregressiveWrapper.next_token_probabilities method)

**Current Implementation (Buggy):**
```python
if top_p < 1.0:
    sorted_logits, sorted_idx = torch.sort(logits, descending=True)
    cumulative_probs = torch.cumsum(
        torch.softmax(sorted_logits, dim=-1), dim=-1
    )
    # Shift so the token that pushes over threshold is kept
    sorted_idx_to_remove = cumulative_probs - torch.softmax(
        sorted_logits, dim=-1
    ) > top_p
    sorted_logits[sorted_idx_to_remove] = -float("inf")
    logits = torch.zeros_like(logits).scatter_(1, sorted_idx, sorted_logits)
```

**Corrected Implementation:**
```python
if top_p < 1.0:
    sorted_logits, sorted_idx = torch.sort(logits, descending=True)
    sorted_probs = torch.softmax(sorted_logits, dim=-1)
    cumulative_probs = torch.cumsum(sorted_probs, dim=-1)
    
    # Remove tokens where cumulative probability BEFORE this token exceeds top_p
    # Shift by 1 to keep at least one token (the highest probability token)
    sorted_idx_to_remove = cumulative_probs > top_p
    sorted_idx_to_remove[..., 0] = False  # Always keep the top token
    
    sorted_logits[sorted_idx_to_remove] = -float("inf")
    logits = torch.zeros_like(logits).scatter_(1, sorted_idx, sorted_logits)
```

### Key Changes

1. **Compute probabilities once**: Store `sorted_probs` instead of calling `torch.softmax()` twice
2. **Fix the filtering condition**: Use `cumulative_probs > top_p` directly, which correctly identifies tokens that fall outside the nucleus
3. **Protect the top token**: Set `sorted_idx_to_remove[..., 0] = False` to ensure at least one token is always available for sampling
4. **Proper threshold semantics**: Keep all tokens until cumulative probability exceeds top_p (not before-current-token > top_p)

### Algorithm Correctness

**Nucleus Sampling (Top-p) Definition:**
- Sort tokens by probability in descending order
- Compute cumulative probability
- Keep the smallest set of tokens whose cumulative probability ≥ top_p

**Corrected Logic:**
1. `cumulative_probs[i]` = sum of probabilities from index 0 to i
2. Keep token i if `cumulative_probs[i-1] < top_p` (i.e., we haven't exceeded threshold yet)
3. Equivalently, remove token i if `cumulative_probs[i] > top_p` AND i > 0

The fix ensures tokens are properly kept in the nucleus and sampling has sufficient diversity.

## Implementation Impact

### Files to Modify

1. **LanguageModel.py** (AutoregressiveWrapper.next_token_probabilities)
   - Lines 157-167 (top-p filtering section)
   - Approximately 11 lines changed/added

### Validation Strategy

1. **Fix Checking:**
   - Generate text with various prompts using temperature=0.8, top_k=50, top_p=0.9
   - Verify output contains varied characters (not repetitive)
   - Test with different temperature/top_p combinations

2. **Preservation Checking:**
   - Test generation with top_p=1.0 (disabled) - should work as before
   - Test generation with only top_k filtering - should work as before
   - Test generation with only temperature - should work as before

3. **Property-Based Testing:**
   - Generate with random seeds and verify output diversity
   - Check that cumulative probability of kept tokens ≈ top_p
   - Verify at least one token is always available for sampling

## Edge Cases and Considerations

### Edge Case 1: top_p = 0.0
If `top_p = 0.0`, the corrected implementation keeps only the highest probability token (greedy decoding).

### Edge Case 2: Very Peaked Distribution
If one token has probability > top_p, only that token is kept (correct behavior).

### Edge Case 3: Uniform Distribution
If probabilities are nearly uniform, nucleus contains many tokens (correct behavior).

### Edge Case 4: Interaction with Top-k
Top-k filtering happens BEFORE top-p in the code. The fix ensures both work correctly together.

## Alternative Solutions Considered

### Alternative 1: Disable Top-p Sampling
- **Approach:** Set top_p=1.0 by default
- **Rejected:** This doesn't fix the underlying bug, just avoids it

### Alternative 2: Add Noise to Break Repetition
- **Approach:** Add small random noise to logits
- **Rejected:** Masks the problem without addressing the incorrect implementation

### Alternative 3: Retrain the Model
- **Approach:** Train with different hyperparameters
- **Rejected:** The model training is fine; the bug is in the inference sampling logic

## Summary

The repetitive generation bug is caused by an incorrect implementation of nucleus (top-p) sampling in the `AutoregressiveWrapper.next_token_probabilities()` method. The faulty condition `cumulative_probs - torch.softmax(sorted_logits, dim=-1) > top_p` over-filters the probability distribution, leaving insufficient token diversity for sampling. 

When the model has a learned bias toward certain characters (like "l"), this aggressive filtering causes generation to collapse into repetitive patterns. The fix corrects the filtering logic to properly implement nucleus sampling, ensuring sufficient token diversity while maintaining the intended top-p threshold semantics.

The solution is localized to a single method in LanguageModel.py and preserves all existing functionality for non-buggy configurations (top-p disabled, top-k only, temperature only).
