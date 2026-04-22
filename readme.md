# TornIQ — Torn.com Analytics Dashboard

<div align="center">

![TornIQ Banner](https://img.shields.io/badge/TornIQ-Analytics%20Dashboard-f59e0b?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzA5MDkwYiIgZD0iTTMgM2gxOHYxOEgzeiIvPjxwYXRoIGZpbGw9IiNmNTllMGIiIGQ9Ik0xMiA2bDMgNi0zIDYtMy02eiIvPjwvc3ZnPg==)

[![Next.js](https://img.shields.io/badge/Next.js%2014-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on%20Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)

**A production-grade analytics SaaS for competitive Torn.com players.**  
Real-time market intelligence, attack target recommendations, and trade scanning — powered by the official Torn API.

[Live Demo](https://torniq.vercel.app) · [Report Bug](https://github.com/AtharvaKarve07/torniq/issues) · [Request Feature](https://github.com/AtharvaKarve07/torniq/issues)

</div>

---

## 📸 Screenshots

| Dashboard | Market Intelligence |
|---|---|
| ![Dashboard](https://placehold.co/600x340/09090b/f59e0b?text=Dashboard) | ![Market](https://placehold.co/600x340/09090b/f59e0b?text=Market+Intel) |

| Attack Finder | Trade Scanner |
|---|---|
| ![Attack](https://placehold.co/600x340/09090b/34d399?text=Attack+Finder) | ![Trade](https://placehold.co/600x340/09090b/60a5fa?text=Trade+Scanner) |

---

## ✨ Features

### 📊 Market Intelligence
- Tracks 200+ Torn items with **live market prices** from the Torn API
- Calculates **Simple Moving Averages** (7-day and 30-day) and stores historical price data
- Detects **Buy / Sell / Hold signals** based on price deviation from moving averages
- Interactive **price history charts** powered by Recharts
- Searchable and sortable market table with signal strength indicators

### ⚔️ Attack Finder
- Ranks attack targets by **estimated win probability** using a sigmoid scoring model
- **Risk scoring** factors in target activity status, hospitalization, and defend history
- **Reward estimation** based on target level and estimated networth
- Filters by level range, win probability threshold, and risk tolerance
- Direct links to Torn profiles — **no automation, recommendations only**

### 💰 Trade Scanner
- Compares live bazaar listing prices against market averages
- Detects **underpriced listings** and ranks by profit percentage
- Adjustable minimum profit threshold (5%–50%)
- Direct links to seller bazaars on Torn.com
- Stores opportunities in PostgreSQL for fast repeated queries

### 🛒 Bazaar Optimizer
- Enter your own bazaar items and get **competitive pricing recommendations**
- Compares your prices to the live market average
- Flags overpriced and underpriced items
- Suggests optimal prices (market average − 2%) for faster sales
- Shows revenue comparison: your pricing vs. optimized pricing

### 👤 Profile Analytics
- Real-time **energy, nerve, and happy** resource bars
- Combat stats **radar chart** (Strength, Defense, Speed, Dexterity)
- Weekly activity bar chart (attacks + crimes per day)
- Win rate, net worth, and attack history at a glance

### 🔐 Authentication
- Simple Torn API key input — **no account creation needed**
- Key is XOR-obfuscated before localStorage storage
- Read-only API access — TornIQ never writes to your Torn account
- Session persists across browser refreshes

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR, API routes, routing |
| **Language** | TypeScript | Type safety throughout |
| **Styling** | Tailwind CSS | Utility-first dark theme |
| **Database** | PostgreSQL + Prisma ORM | Price history, trade opportunities |
| **State** | Zustand + TanStack Query | Auth persistence + server caching |
| **Charts** | Recharts | Area, bar, radar charts |
| **Fonts** | Syne + Inter + JetBrains Mono | Display, body, data |
| **Deployment** | Vercel | Edge functions + CDN |
| **DB Host** | Neon (serverless Postgres) | Scalable, free tier |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js 14 App                      │
├─────────────────┬───────────────────────────────────────┤
│   Client Side   │           Server Side                 │
│                 │                                       │
│  React Pages    │   API Routes (/api/*)                 │
│  Zustand Store  │   ├── /auth/validate                  │
│  TanStack Query │   ├── /user/dashboard                 │
│  Recharts       │   ├── /market/items                   │
│                 │   ├── /trade                          │
│                 │   └── /players                        │
│                 │                                       │
│                 │   Torn API Service Layer              │
│                 │   ├── Rate limiter (token bucket)     │
│                 │   ├── In-memory cache (TTL)           │
│                 │   └── Error normalization             │
│                 │                                       │
│                 │   PostgreSQL + Prisma                 │
│                 │   ├── ItemPriceHistory                │
│                 │   ├── TradeOpportunity                │
│                 │   └── CachedPlayerData                │
└─────────────────┴───────────────────────────────────────┘
```

### Key Design Decisions

- **API key stays client-side** — the key is sent directly from the browser to Torn's API via Next.js API routes acting as a proxy (solving CORS). It is never stored in the database.
- **Token-bucket rate limiter** — prevents hitting Torn's 100 req/min limit per key
- **Redis-ready cache** — in-memory `Map` with TTL that can be swapped for ioredis with zero refactoring
- **Demo mode** — all pages show realistic data when the database is empty, using live Torn prices + simulated price history

---

## 📐 Database Schema

```prisma
model ItemPriceHistory    // Historical item prices — powers MA charts
model TradeOpportunity   // Detected underpriced listings
model CachedPlayerData   // Player profiles for attack finder
model AttackLog          // Attack recommendation outcomes
model MarketSnapshot     // Periodic full-market snapshots
model User               // TornIQ user accounts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+
- PostgreSQL database ([Neon](https://neon.tech) free tier recommended)
- Torn.com account with an API key

### Installation

```bash
# Clone the repository
git clone https://github.com/AtharvaKarve07/torniq.git
cd torniq

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your DATABASE_URL
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@host:5432/torniq?sslmode=require"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Optional: seed with demo data
npm run db:seed
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste your Torn API key, and start exploring.

---

## 📦 Deployment (Vercel)

1. Fork this repository
2. Import to [Vercel](https://vercel.com)
3. Add environment variables in Vercel → Settings → Environment Variables:
   - `DATABASE_URL` — your Neon/Supabase connection string
   - `NEXT_PUBLIC_APP_URL` — your Vercel deployment URL
4. Set build command: `prisma generate && prisma db push && next build`
5. Deploy ✅

---

## 📁 Project Structure

```
torniq/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Demo data seeder
│
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # Backend API routes
│   │   ├── dashboard/         # Main overview
│   │   ├── market/            # Market intelligence
│   │   ├── attack-finder/     # Attack recommendations
│   │   ├── trade-scanner/     # Trade opportunity scanner
│   │   ├── bazaar/            # Bazaar price optimizer
│   │   └── profile/           # Profile analytics
│   │
│   ├── components/            # Reusable React components
│   │   ├── layout/            # Sidebar, Header, AppLayout
│   │   └── ui/                # StatCard, DataTable, Badge, etc.
│   │
│   ├── lib/
│   │   ├── torn.ts            # Torn API service (rate limit + cache)
│   │   ├── analytics.ts       # Market analytics engine (SMA, signals)
│   │   ├── prisma.ts          # Prisma client singleton
│   │   └── utils.ts           # Utility functions
│   │
│   ├── hooks/
│   │   └── useQueries.ts      # TanStack Query data hooks
│   │
│   ├── stores/
│   │   ├── authStore.ts       # Auth state (Zustand + persist)
│   │   └── sidebarStore.ts    # Sidebar collapse state
│   │
│   └── types/
│       └── torn.ts            # Complete Torn API TypeScript types
```

---

## 🧠 Analytics Engine

### Signal Detection Algorithm

```typescript
// Price is compared against two moving averages
// Thresholds are calibrated for Torn's market volatility

if (currentPrice < ma7 * 0.92)  buyScore  += 0.4  // 8% below 7D MA
if (currentPrice < ma30 * 0.88) buyScore  += 0.5  // 12% below 30D MA
if (currentPrice > ma7 * 1.08)  sellScore += 0.4  // 8% above 7D MA
if (currentPrice > ma30 * 1.12) sellScore += 0.5  // 12% above 30D MA

// Net score determines signal
if (net > 0.15) → BUY
if (net < -0.15) → SELL
else → HOLD
```

### Win Probability Model

```typescript
// Sigmoid function centered at stat ratio
P(win) = 1 / (1 + e^(-4 * (userStats / targetStats - 1)))

// Risk modifiers
if (target.status === 'Hospital') risk *= 0.3
```

---

## ⚠️ Disclaimer

TornIQ is an **unofficial, read-only** analytics tool for Torn.com. It is not affiliated with, endorsed by, or connected to Torn Ltd. All data is fetched from the official [Torn API](https://www.torn.com/api.html).

**No automation** — TornIQ only provides recommendations. All actions (attacks, purchases) must be performed manually on Torn.com.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">

Built with ❤️ using Next.js, TypeScript, and the Torn API

⭐ Star this repo if you found it useful!

</div>