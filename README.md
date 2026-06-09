# Transformer Visualizer

An interactive 3D visualization of transformer model internals built with Next.js. Watch your model process text through tokenization, embeddings, attention mechanisms, and output generation in real-time.

![Professional, modern design with interactive 3D pipeline]

## ✨ Features

- 🎨 **Interactive 3D Pipeline** - Click stages to explore, rotate, zoom, and pan
- 🔍 **Attention Visualization** - Interactive heatmaps with hover details
- 📊 **Probability Distributions** - Animated prediction bars
- 🌙 **Dark Mode** - Professional design in light and dark themes
- ⚡ **Real-time Processing** - Live updates as your model generates text
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start exploring!

## 📖 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get up and running in 3 steps
- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration guide
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete project overview

## 🎯 How to Use

1. **Enter text** in the input field
2. **Click Generate** to process through your transformer
3. **Watch the 3D pipeline** animate through each stage
4. **Click on stages** to see detailed internals
5. **Explore results** - tokens, attention weights, predictions

Click the **help button** (bottom-right) for interactive tutorials!

## 🏗️ Architecture

```
Input Text
    ↓
Tokenizer → Embedding → Positional Encoding
    ↓
Encoder (Self-Attention + Feed-Forward)
    ↓
Decoder (Masked Attention + Cross-Attention)
    ↓
Output Layer (Probability Distribution)
    ↓
Next Token Prediction
```

## 🛠️ Tech Stack

- **Next.js 16** - React framework
- **Three.js** - 3D graphics
- **Framer Motion** - Smooth animations
- **Tailwind CSS 4** - Modern styling
- **TypeScript** - Type safety

## 📁 Project Structure

```
app/
├── page.tsx                      # Main application
├── components/
│   ├── TransformerPipeline3D.tsx # 3D visualization
│   ├── StageDetail.tsx           # Stage details modal
│   ├── AttentionHeatmap.tsx      # Attention visualization
│   ├── PredictionBars.tsx        # Predictions display
│   ├── TokenStrip.tsx            # Token display
│   ├── ProcessingAnimation.tsx   # Loading state
│   └── InfoPanel.tsx             # Help panel
└── api/
    └── generate/route.ts         # Python integration
```

## 🔌 Python Integration

Connect your trained transformer model:

1. Update `app/api/generate/route.ts` with your Python path
2. Use the provided `transformer/api_generate.py` wrapper
3. Model outputs JSON with tokens, attention, and predictions

See [SETUP.md](./SETUP.md) for detailed instructions.

## 🎨 Design Philosophy

- **Professional** - Clean, modern aesthetic
- **Interactive** - Click, hover, explore
- **Educational** - Understand transformer internals
- **Accessible** - Proper contrast, keyboard navigation
- **Responsive** - Works everywhere

No high-contrast funky designs - just elegant, professional visualization.

## 💡 Use Cases

- **Learning** - Understand how transformers work
- **Debugging** - Visualize model behavior
- **Presentations** - Demo your model interactively
- **Development** - Test different inputs and parameters

## 🤝 Contributing

This is a complete, production-ready visualization. To extend:

- Add new components in `app/components/`
- Update stage details in `StageDetail.tsx`
- Customize colors and animations
- Add new visualization types

## 📝 License

Built for educational and professional use.

---

**Ready to explore?** Start with [QUICKSTART.md](./QUICKSTART.md)!

Built with ❤️ using modern web technologies.
