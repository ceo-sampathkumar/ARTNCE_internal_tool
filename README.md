# ARTNCE Painting Production Cost Calculator

Production-ready, Vercel-deployable Next.js web application and PostgreSQL database schema for the **ARTNCE Painting Production Cost Calculator**.

---

## 🚀 Features

- **Exact Costing Benchmark**: Reproduces the canonical 3×4 ft painting production benchmark (Canvas ₹1,800 + Stretching & Support ₹1,200 + Floater Frame ₹2,400 + 2% Transport = ₹5,508 / ₹459 sq ft).
- **Zero-Dependency Local Fallback**: Operates 100% in standalone mode using browser `localStorage` when no database is connected. No crashes, no missing keys errors.
- **PostgreSQL + Prisma ORM Ready**: Connect any PostgreSQL database (Supabase, Neon, Vercel Postgres, AWS RDS) by simply adding `DATABASE_URL`.
- **Saved Quotes & Snapshots**: Preserves historical quotes with immutable snapshots of rates and calculation breakdowns.
- **Vercel Deployable**: Pre-configured with Next.js App Router and Tailwind CSS for 1-click deployment.

---

## 📦 Project Structure

```
artnce_internal_tool/
├── app/
│   ├── api/
│   │   ├── settings/route.js        # API route for cost settings & pricing presets
│   │   └── quotes/
│   │       ├── route.js             # API route for creating & listing saved quotes
│   │       └── [id]/route.js        # API route for single quote deletion/retrieval
│   ├── globals.css                  # Typography, fonts & design tokens
│   ├── layout.jsx                   # Next.js root layout with font prefetching
│   └── page.jsx                     # Main calculator page
├── components/
│   └── PaintingCostCalculator.jsx   # UI component with dual DB/localStorage persistence
├── lib/
│   ├── calculator.js                # Pure, UI-agnostic calculation engine & formulas
│   └── db.js                        # Prisma client singleton & DB connection helper
├── prisma/
│   └── schema.prisma                # PostgreSQL schema (CostSettings, ExtraComponent, Quotes)
├── tests/
│   └── verify-calculator.js         # Automated test suite for benchmarks & formulas
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment variables
├── package.json                     # Scripts & dependencies
├── schema.sql                       # Pure PostgreSQL DDL script
├── tailwind.config.js               # Tailwind CSS theme configuration
└── vercel.json                      # Vercel deployment configuration
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Optional** | PostgreSQL connection string. If omitted, the app uses browser `localStorage`. | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | Optional | Base URL for the application. | `http://localhost:3000` |
| `API_SECRET_KEY` | Optional | Secret key for securing API endpoints if needed. | `your-secret-key-32-chars` |

---

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Verification Tests
```bash
npm test
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup & Migrations (PostgreSQL)

When you are ready to connect a PostgreSQL database (e.g. Supabase, Neon, or Vercel Postgres):

### Option A: Using Prisma (Recommended)
1. Set `DATABASE_URL` in `.env.local` or your Vercel Environment Variables.
2. Push the schema to your database:
   ```bash
   npx prisma db push
   ```
3. (Optional) Open Prisma Studio to inspect records:
   ```bash
   npx prisma studio
   ```

### Option B: Using Raw SQL
Run the SQL script [`schema.sql`](./schema.sql) in your database query editor (e.g., Supabase SQL Editor, pgAdmin, psql).

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com) → **Add New Project** → Import the repository.
3. **Environment Variables**:
   - You can deploy **immediately without any environment variables** (the app will default to localStorage mode).
   - Once your PostgreSQL database is provisioned, add `DATABASE_URL` in the Vercel project settings under **Settings → Environment Variables** and redeploy.
4. Click **Deploy**.

---

## 📊 Database Schema Reference

- **`CostSettings` (`cost_settings`)**: Rates for canvas print, stretching mode (`combined` / `separate`), beam threshold rules, external floater frame, and transport percentage.
- **`ExtraComponent` (`extra_components`)**: Configurable additional line items (Varnish, Labour, Packing, GST, etc.).
- **`PricingPreset` (`pricing_presets`)**: Selling price calculations (Markup % or Gross Margin %).
- **`CalculationQuote` (`calculation_quotes`)**: Complete saved production quotes with immutable snapshots of breakdown items and settings at creation time.
