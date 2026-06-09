import sys
import os
os.environ["CUBLAS_WORKSPACE_CONFIG"] = ":4096:8"
import json
import torch
import numpy as np
from LanguageModel import LanguageModel, AutoregressiveWrapper
from Tokenizer import Tokenizer
from utils import get_device, pad_left

torch.backends.cuda.matmul.allow_tf32 = False  # disable TF32 — causes silent bugs on some 30-series
torch.use_deterministic_algorithms(False)

def generate_with_details(model, tokenizer, input_text, max_length=80):
    """
    Generate text and return detailed information about the process,
    matching test.py's sampling parameters.
    """
    device = get_device()
    model.eval()
    
    # Tokenize input
    tokens = tokenizer.tokenize(input_text)
    token_strings = [tokenizer.token_to_character(t) for t in tokens]
    
    pad_id = tokenizer.character_to_token("<pad>")
    max_ctx = model.max_sequence_length
    
    # Generate text
    generated_tokens = tokens.copy()
    all_predictions = []
    
    padded = pad_left(
        sequence=tokens,
        final_length=max_ctx + 1,
        padding_token=pad_id,
    )
    out = torch.tensor(padded, dtype=torch.long, device=device).unsqueeze(0)
    
    with torch.no_grad():
        for _ in range(max_length):
            context = out[:, -max_ctx:]
            mask = (context != pad_id)
            
            # Forward pass to get raw predictions for the UI
            raw_logits = model.model(context, mask)[0, -1, :]
            probs = torch.softmax(raw_logits, dim=-1)
            
            # Get top predictions for UI
            top_probs, top_indices = torch.topk(probs, k=10)
            predictions = [
                {
                    'token': tokenizer.token_to_character(idx.item()),
                    'probability': prob.item()
                }
                for prob, idx in zip(top_probs, top_indices)
            ]
            all_predictions.append(predictions)
            
            # Sample next token using test.py settings
            next_token_probs = model.next_token_probabilities(
                x=context,
                mask=mask,
                temperature=0.8,
                top_k=50,
                top_p=0.9,
            )
            
            next_token = torch.multinomial(next_token_probs, num_samples=1)
            token_id = next_token.item()
            
            generated_tokens.append(token_id)
            out = torch.cat([out, next_token], dim=1)
            
            # Stop if we hit end of sequence (if you want to stop on period like before, or just run max_length)
            # test.py just runs to max_tokens_to_generate, so we will too.
            # No early stopping here to match test.py

    # Decode output
    output_text = "".join([tokenizer.token_to_character(t) for t in generated_tokens])
    
    # Create mock attention weights (you can extract real ones from your model)
    num_tokens = len(token_strings)
    mock_attention = np.random.rand(num_tokens, num_tokens).tolist()
    
    # Normalize attention weights to sum to 1
    for i in range(num_tokens):
        row_sum = sum(mock_attention[i])
        mock_attention[i] = [w / row_sum for w in mock_attention[i]] if row_sum > 0 else [1.0 / num_tokens] * num_tokens
    
    return {
        'input': input_text,
        'output': output_text,
        'tokens': token_strings,
        'attention': mock_attention,
        'predictions': all_predictions[-1] if all_predictions else []
    }

def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError("No input text provided")
        
        input_text = sys.argv[1]
        
        # Load tokenizer
        tokenizer = Tokenizer()
        
        # Load model - use absolute path or relative from transformer directory
        model = AutoregressiveWrapper.load_checkpoint('trained_model')
        
        # Generate with details
        result = generate_with_details(model, tokenizer, input_text)
        
        # Output as JSON
        print(json.dumps(result))
        
    except Exception as e:
        # Output error as JSON
        error_result = {
            'error': str(e),
            'input': sys.argv[1] if len(sys.argv) > 1 else '',
            'output': '',
            'tokens': [],
            'attention': [],
            'predictions': []
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
