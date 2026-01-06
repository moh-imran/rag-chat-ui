# RAG Chat UI

Professional React + TypeScript chat interface for RAG (Retrieval Augmented Generation) applications.

## Features

- 🎨 Modern, responsive UI with Tailwind CSS
- 📝 TypeScript for type safety
- ⚡ Fast development with Vite
- 🔄 Real-time chat with streaming support
- 📁 Document upload with progress tracking
- 🎯 Source citations with relevance scores
- ⚙️ Configurable settings (Top-K, temperature)
- 🌙 Dark theme optimized

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8001

### Installation

\`\`\`bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
\`\`\`

Visit http://localhost:5173

### Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Project Structure

\`\`\`
src/
├── components/          # React components
│   ├── ChatContainer.tsx
│   ├── ChatMessage.tsx
│   ├── Header.tsx
│   ├── SettingsPanel.tsx
│   └── UploadStatusBar.tsx
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Utilities
│   └── api.ts
├── App.tsx             # Main app
├── main.tsx            # Entry point
└── index.css           # Global styles
\`\`\`

## Environment Variables

\`\`\`
VITE_API_URL=http://localhost:8001
\`\`\`

## Deployment

### Vercel (Recommended)

\`\`\`bash
npm install -g vercel
vercel
\`\`\`

### Netlify

\`\`\`bash
npm run build
netlify deploy --prod --dir=dist
\`\`\`

## License

MIT