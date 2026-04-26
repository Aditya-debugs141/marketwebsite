# MarketWebsite 📈

> **Real-Time Indian Stock Market Intelligence Dashboard** — Live NSE/BSE data, AI-powered news sentiment, and an interactive market heatmap.

A full-stack Next.js application that aggregates live stock data from multiple sources, runs AI sentiment analysis on financial news, and presents it in a real-time dashboard with WebSocket updates and 3D visualizations.

---

## ✨ Features

- **Live Market Data** — Real-time NSE/BSE quotes via `stock-nse-india` and `yahoo-finance2`
- **AI News Sentiment** — Analyses financial news using Gemini, OpenRouter, or Groq LLM APIs
- **Market Heatmap** — Interactive sector-based visual heatmap of market performance
- **Real-Time Updates** — WebSocket server (`socket.io`) pushes live price updates to all clients
- **3D Visualization** — React Three Fiber / Three.js powered interactive charts
- **Angel One Integration** — SmartAPI connection for authenticated brokerage data
- **Intelligent Caching** — Server-side deal cache to prevent redundant API calls
- **News Aggregation** — RSS parser pulls the latest financial news from multiple feeds

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| 3D Graphics | Three.js + React Three Fiber |
| Animations | Framer Motion |
| Real-Time | Socket.io (custom WSS server) |
| AI Providers | Google Gemini, OpenRouter, Groq |
| Stock Data | `stock-nse-india`, `yahoo-finance2` |
| Brokerage API | Angel One SmartAPI |
| Icons | Lucide React |
| Charts | Recharts |

---

## 🚀 Local Setup

### 1. Prerequisites
- Node.js 20+
- npm or yarn
- (Optional) A [Groq API key](https://console.groq.com/) for AI sentiment

### 2. Clone the repository
```bash
git clone https://github.com/Aditya-debugs141/marketwebsite.git
cd marketwebsite
```

### 3. Install dependencies
```bash
npm install
```

### 4. Configure environment variables
```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your values:
```env
# AI providers (at least one recommended)
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
OPENROUTER_API_KEY=your_openrouter_key_here

# Optional model overrides
GROQ_MODEL=llama-3.1-8b-instant
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Runtime
NODE_ENV=development
```

> **Note:** The app has intelligent fallback logic. If only one AI provider key is configured, it will use that one. If none are set, AI sentiment features will be disabled but all stock data features remain active.

### 5. Run the development servers

You need **two terminal windows**:

**Terminal 1 — Next.js frontend:**
```bash
npm run dev
```
Available at **http://localhost:3000**

**Terminal 2 — WebSocket server (for real-time updates):**
```bash
npm run server
```
The WSS server runs on its own port (see `src/server/wss-server.ts` for config).

---

## 📁 Project Structure

```
marketwebsite/
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   │   ├── api/
│   │   │   ├── deals/          # Stock deal aggregation endpoint
│   │   │   ├── heatmap/        # Market heatmap data endpoint
│   │   │   └── news/           # AI-analysed news endpoint
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Main dashboard page
│   ├── components/             # React UI components
│   │   ├── DealCard.tsx        # Individual stock deal card
│   │   ├── DealFilters.tsx     # Filter controls
│   │   ├── NewsCard.tsx        # News article with sentiment badge
│   │   └── ...
│   ├── server/                 # Server-side services (NOT client-side)
│   │   ├── angel-one-service.ts    # Angel One SmartAPI integration
│   │   ├── wss-server.ts           # Standalone Socket.io WebSocket server
│   │   ├── cache/
│   │   │   └── deal-cache.ts   # In-memory caching layer
│   │   ├── engine/
│   │   │   ├── deal-engine.ts  # Core stock data aggregation logic
│   │   │   └── impact-engine.ts# News impact scoring
│   │   └── data-sources/       # Individual data provider adapters
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Shared utilities and helpers
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── package.json
```

---

## 🔒 Security & Environment

- **Never commit `.env.local` or `.env`** — they are in `.gitignore`
- Use `.env.example` as the template — it contains no real secrets
- API keys should be treated as secrets and rotated if ever exposed
- The WebSocket server runs separately from Next.js and is not exposed to the client bundle

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production Next.js server |
| `npm run server` | Start the standalone WebSocket server |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with a clear message
4. Push and open a Pull Request
5. **Never commit API keys or `.env` files**

---

## 📄 License

MIT License
