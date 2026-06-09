# Transformer Visualizer Setup Guide

This is a professional, modern, and interactive 3D visualization of your transformer model built with Next.js.

## Features

✨ **Interactive 3D Pipeline Visualization**
- Click on any pipeline stage (Tokenizer → Embedding → Encoder → Decoder → Output)
- Explore the internal workings of each component
- Real-time animation of data flow through the pipeline

📊 **Comprehensive Visualizations**
- Token strip showing input tokenization
- Attention heatmaps with interactive hover details
- Probability distribution bars for next token prediction
- Professional, modern design with dark mode support

🔄 **Real-time Processing**
- Connect to your trained transformer model
- See live predictions and attention patterns
- Smooth animations showing data flow

## Setup Instructions

### 1. Install Dependencies

The required packages are already installed:
- `three` - 3D graphics library
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Helper components for React Three Fiber
- `framer-motion` - Animation library
- `recharts` - Chart library
- `lucide-react` - Modern icon set

### 2. Configure Python Integration

Update the API route to use your conda environment:

Edit `app/api/generate/route.ts` and change the Python command:

```typescript
// Option 1: Use conda environment directly
const pythonProcess = spawn('C:\\Users\\Jatin\\anaconda3\\envs\\torch_gpu\\python.exe', [scriptPath, inputText]);

// Option 2: Activate conda and run
const pythonProcess = spawn('cmd', ['/c', 'conda activate torch_gpu && python', scriptPath, inputText]);
```

### 3. Update Your Python Model (Optional)

For better integration, modify your `test.py` or use the provided `api_generate.py`:

```python
import sys
import json
from LanguageModel import LanguageModel

# ... your generation code ...

# Output as JSON
result = {
    'input': input_text,
    'output': generated_text,
    'tokens': token_list,
    'attention': attention_weights,
    'predictions': top_predictions
}
print(json.dumps(result))
```

### 4. Run the Development Server

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter Text**: Type your prompt in the input field
2. **Generate**: Click the "Generate" button
3. **Watch the Pipeline**: See the 3D visualization animate through each stage
4. **Explore Stages**: Click on any stage in the 3D view to see detailed information
5. **View Results**: Examine the tokenization, attention weights, and predictions

## Component Structure

```
app/
├── page.tsx                          # Main page with input and orchestration
├── components/
│   ├── TransformerPipeline3D.tsx    # 3D pipeline visualization
│   ├── StageDetail.tsx              # Detailed view modal for each stage
│   ├── TokenStrip.tsx               # Token display component
│   ├── AttentionHeatmap.tsx         # Interactive attention visualization
│   └── PredictionBars.tsx           # Probability distribution bars
└── api/
    └── generate/
        └── route.ts                  # API endpoint for Python integration
```

## Customization

### Colors and Theme

Edit the component files to customize colors:
- Pipeline stages: `TransformerPipeline3D.tsx` (line ~15)
- Attention heatmap colors: `AttentionHeatmap.tsx` (line ~13)
- Prediction bar colors: `PredictionBars.tsx` (line ~34)

### Model Parameters

Update stage information in `StageDetail.tsx` to match your model's actual configuration:
- Number of layers
- Attention heads
- Embedding dimensions
- Feed-forward dimensions

### Animation Speed

Adjust animation timing in `page.tsx`:
```typescript
await new Promise(resolve => setTimeout(resolve, 400)); // Change 400 to your preferred delay
```

## Troubleshooting

### 3D View Not Rendering
- Make sure you're viewing in a modern browser (Chrome, Firefox, Edge)
- Check browser console for WebGL errors

### Python Integration Issues
- Verify Python path in `route.ts`
- Test your Python script independently first
- Check that all required packages are installed in your conda environment

### API Errors
- The app will fall back to mock data if the Python API fails
- Check the browser console and terminal for error messages
- Ensure your trained model file exists at `./transformer/trained_model`

## Next Steps

- Connect real attention weights from your model
- Add more detailed layer-by-layer visualization
- Implement interactive parameter tuning (temperature, top-k, etc.)
- Add export functionality for visualizations
- Implement batch processing for multiple inputs

## Design Philosophy

This visualization follows modern design principles:
- **Clean and Professional**: Minimal UI with focus on content
- **Interactive**: Click to explore, hover for details
- **Responsive**: Works on different screen sizes
- **Accessible**: Proper contrast ratios and keyboard navigation
- **Performant**: Optimized rendering and animations

No high-contrast funky designs - just clean, modern, professional visualization! 🎨
