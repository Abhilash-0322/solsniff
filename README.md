# SolSniff ⚡ — Solana Narrative Detection & Idea Generation Tool

> AI-powered tool that detects emerging narratives in the Solana ecosystem and generates actionable build ideas. Refreshed fortnightly.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solana](https://img.shields.io/badge/ecosystem-Solana-9945FF.svg)
![AI](https://img.shields.io/badge/powered_by-AI_Agents-14F195.svg)

## 🚀 What is SolSniff?

SolSniff is a **narrative detection and idea generation engine** for the Solana ecosystem. It continuously monitors on-chain activity, developer trends, social sentiment, and news to surface **emerging narratives before they become mainstream**, then generates **actionable build ideas** tied to each narrative.

Built as an **AI Agent** system, SolSniff runs a multi-stage pipeline:

1. **📡 Data Collection** — Parallel collectors gather signals from 4 source categories
2. **📊 Signal Scoring** — Each signal scored 0-100 based on source-specific metrics
3. **🧠 Narrative Detection** — AI clusters signals into 4-7 coherent narratives
4. **💡 Idea Generation** — 3-5 concrete product ideas per narrative
5. **🔄 Fortnightly Refresh** — Configurable schedule keeps analysis current

---

## 📡 Data Sources

| Source | Provider | What We Track |
|--------|----------|---------------|
| **On-Chain** | Helius RPC, Solana Public RPC, DeFiLlama | TPS, epoch progress, validator count, SOL supply, DeFi TVL, protocol growth, DeFi category distribution |
| **Developer** | GitHub API | Trending Solana repos, core org activity (solana-labs, coral-xyz, jup-ag, etc.), new projects by topic |
| **Social** | LunarCrush, CoinGecko, Reddit | Social volume, Galaxy Score, sentiment, trending tokens, SOL market data, r/solana hot posts |
| **News** | CryptoPanic, CoinGecko | Aggregated crypto news, community growth, developer data, sentiment voting |

---

## 🧠 How Signals Are Detected and Ranked

### Signal Scoring (0-100)

Each signal receives a composite score based on source-specific metrics:

- **On-chain**: TPS deviation from average, TVL % change (7d), validator count thresholds
- **GitHub**: Star velocity, fork count, recency of creation, topic breadth
- **Social**: Upvote ratio, comment count, social volume, sentiment scores
- **News**: Source authority weighting, vote ratio, recency decay

### Narrative Clustering

The Groq-powered LLM (Llama 3.3 70B) analyzes the top-40 scored signals and:
- Groups related signals across different source types into coherent themes
- Prioritizes **cross-source validation** (signals from 3+ sources = stronger narrative)
- Assesses narrative **novelty** (not yet mainstream), **velocity** (emerging vs. established), and **actionability** (can builders capitalize?)
- Assigns confidence scores and trend direction to each narrative

### Idea Generation

For each narrative, the AI generates 3-5 product ideas with:
- Problem/solution articulation
- Target audience identification
- Feasibility assessment (low/medium/high)
- Technical requirements
- Potential challenges
- Viability score (0-100)

---

## 🔥 Detected Narratives

> Run the tool to get the latest narratives. Below is a sample of the types of narratives detected:

The tool dynamically detects narratives such as:
- DeFi protocol innovation waves
- Developer migration patterns
- Infrastructure upgrade narratives (Firedancer, Alpenglow)
- AI × Crypto convergence on Solana
- Institutional adoption signals
- New primitive emergence (intents, orderflow, etc.)

**Each narrative comes with 3-5 concrete build ideas** with feasibility analysis.

---

## 💡 Build Ideas

Each detected narrative generates 3-5 actionable product concepts. Example idea format:

```
Title: [Product Name]
Category: defi / nft / infrastructure / tooling / ai / etc.
Problem: What specific gap exists?
Solution: How does the product solve it?
Target Audience: Who uses it?
Feasibility: high / medium / low
Technical Requirements: [Solana programs, APIs, SDKs needed]
Potential Challenges: [Risks and obstacles]
Score: 0-100 viability rating
```

---

## 🏗️ Architecture

```
solsniff/
├── apps/
│   ├── api/          # Express API server
│   └── web/          # Next.js 14 frontend (App Router)
├── packages/
│   ├── shared-types/ # TypeScript type definitions
│   ├── config/       # Environment configuration
│   ├── database/     # Prisma schema (SQLite)
│   ├── data-collectors/ # 4 modular data collectors
│   └── ai-engine/    # LLM providers + AI agents
├── turbo.json        # Turborepo pipeline config
├── package.json      # Workspace root
└── .env.example      # Environment variables template
```

**Key architectural decisions:**
- **Turborepo monorepo** for parallel builds and shared packages
- **Switchable LLM providers** (Groq default → OpenAI, Anthropic via env toggle)
- **Modular collector pattern** with abstract base class, retry logic, rate limiting
- **In-memory caching** with file-based persistence
- **Vanilla CSS** design system for maximum control over premium aesthetics

---

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- A Groq API key ([get one free](https://console.groq.com))

### 1. Clone and Install

```bash
git clone <repo-url> solsniff
cd solsniff
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required
GROQ_API_KEY=your_groq_api_key

# Optional (enhances data quality)
HELIUS_API_KEY=your_helius_key
GITHUB_TOKEN=your_github_pat
LUNARCRUSH_API_KEY=your_lunarcrush_key

# LLM Provider (groq | openai | anthropic)
LLM_PROVIDER=groq
```

### 3. Run Development Servers

```bash
# Start both API and frontend
npm run dev
```

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

### 4. Trigger Analysis

Click the **"⚡ Run Fresh Analysis"** button on the dashboard, or:

```bash
curl -X POST http://localhost:4000/api/analyze
```

---

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check and system status |
| GET | `/api/narratives` | All detected narratives |
| GET | `/api/narratives/:slug` | Single narrative with signals & ideas |
| GET | `/api/ideas` | All generated build ideas |
| GET | `/api/ideas?category=defi` | Filter ideas by category |
| GET | `/api/signals` | Raw signal feed (paginated) |
| GET | `/api/signals?source=onchain` | Filter signals by source |
| GET | `/api/analysis/status` | Analysis pipeline status |
| POST | `/api/analyze` | Trigger manual analysis |

---

## 🔧 Switching LLM Providers

SolSniff uses a provider factory pattern. Change the provider via environment variable:

```env
# Default: Groq (fastest, free tier)
LLM_PROVIDER=groq
GROQ_API_KEY=your_key

# Alternative: OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key

# Alternative: Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key
```

No code changes needed — the provider abstraction handles everything.

---

## 🎨 Design

The frontend features a premium Solana-themed dark UI:
- **Solana color palette** (purple #9945FF, green #14F195, blue #00D4FF)
- **Glassmorphism** cards with backdrop blur
- **Animated particle background** (canvas-based network visualization)
- **Gradient borders** and glow effects
- **Micro-animations** (fade-in, pulse, spring transitions)
- **Inter + JetBrains Mono** typography
- **Fully responsive** (mobile-first)

---

## 📄 License

MIT

---

Built with ⚡ for the Solana ecosystem by AI Agents
