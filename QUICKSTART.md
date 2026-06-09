# 🚀 Quick Start Guide

Get your Transformer Visualizer up and running in 3 steps!

## Step 1: Start the Development Server

```bash
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000)

## Step 2: Test the Interface

The app will work immediately with **mock data** for testing the UI:

1. Enter some text like "Romeo" or "Hi" in the input field
2. Click **Generate**
3. Watch the 3D pipeline animation
4. Click on any stage to explore details
5. View the results: tokens, attention heatmap, and predictions

## Step 3: Connect Your Python Model

To use your actual trained transformer model, update the API route:

### Edit `app/api/generate/route.ts`

Find this line (~line 20):
```typescript
const pythonProcess = spawn('python', [scriptPath, inputText]);
```

Replace with your conda environment path:
```typescript
// Full path to your conda environment's Python
const pythonProcess = spawn('C:\\Users\\Jatin\\anaconda3\\envs\\torch_gpu\\python.exe', [scriptPath, inputText]);
```

### Update the Python Script Path

The API currently points to `transformer/test.py`. You have two options:

**Option A: Use the new API wrapper** (Recommended)
```typescript
// In route.ts, change:
const pythonScriptPath = path.join(process.cwd(), 'transformer', 'api_generate.py');
```

**Option B: Modify your existing test.py**
Add JSON output to your `test.py`:
```python
import json
result = {
    'input': input_text,
    'output': generated_text,
    'tokens': tokens,
    'attention': attention_weights,
    'predictions': predictions
}
print(json.dumps(result))
```

## That's It! 🎉

Your transformer visualization is now ready. The interface will:
- ✅ Show real-time processing through each pipeline stage
- ✅ Display interactive 3D visualization
- ✅ Provide detailed views of attention mechanisms
- ✅ Show probability distributions for predictions

## Pro Tips

💡 **Click stages in the 3D view** to see detailed internal workings

💡 **Hover over attention heatmap cells** to see exact weights

💡 **Try different inputs** to see how the model processes various prompts

💡 **Works in dark mode** - toggle your system theme!

## Need Help?

See [SETUP.md](./SETUP.md) for detailed instructions and troubleshooting.
