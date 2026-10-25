# Celebrate AI — Intelligent Celebration & Event Planner

Celebrate AI is an end-to-end Indian celebration and event planning platform that replaces fragmented spreadsheets, phone calls, and hallucinated advice with a single grounded workspace. Enter event details (or load the pre-cached Golden Jubilee demo) to get a dataset-cited plan, mathematically constrained INR budget allocation, backward-counted checklist, day-of run sheet, cultural muhurat guidance, trilingual printable invitations (English, Hindi, Kannada), and a live shareable guest RSVP portal.

## Key Capabilities

1. **60-Second Event Setup Wizard + Instant Demo Loader**: Supports Weddings, Birthdays, Anniversaries, Festivals, and Corporate gatherings across Bengaluru, Mumbai, Delhi, Hyderabad, and Chennai, plus a 1-click **"Load Demo Event"** (`50th Anniversary, 120 guests, ₹5,00,000, Bengaluru`).
2. **RAG-Grounded AI Plan (Zero Hallucinations)**: Retrieves top-k matching items from a curated 45-vendor, 16-theme, and 7-tradition Indian knowledge base using hybrid Gemini embeddings (`gemini-embedding-2-preview`) + lexical cosine similarity. Every recommendation cites its exact dataset ID (`VEN-BLR-01`, `THM-01`, `CUL-01`) and is validated via Zod schemas with automatic retry.
3. **Smart Budget Planner & Constraint Optimizer**: Visualizes rupee splits via an interactive SVG Donut Chart + spent-vs-planned progress bars. Includes an active-set KKT Lagrange constraint solver enforcing category min/max bounds, priority weights, and locked categories with plain-English trade-off explanations.
4. **Conversational Plan Patching**: Chat naturally (*"Reduce total budget by 20%"*, *"Swap entertainment to a lively DJ & bilingual emcee"*, *"Add live kesar badam kulfi"*). Returns a validated `PlanPatch` JSON that mutates SQLite state and highlights changed cards live.
5. **Cultural, Muhurat & Trilingual Invitation Studio**: Surfaces auspicious muhurat windows, regional rituals, and food etiquette alongside printable invitations in **English**, **हिन्दी (Hindi)**, and **ಕನ್ನಡ (Kannada)**.
6. **Timeline, Day-of Run Sheet & Shareable Guest RSVP**: Backward-counted checklist (`T-45d` to `T-2d`), minute-by-minute vendor arrival coordination table, and a standalone guest RSVP link (`/?rsvp=<token>`) capturing headcount and dietary splits (Pure Veg, Jain, Vegan, Halal, Non-Veg).
7. **100% Offline Fallback**: Pre-seeded SQLite database (`sql.js`) + deterministic RAG fallback ensures the full demo flow works seamlessly even without network access.

## Environment Variables

Copy `.env.example` to `.env`:

```bash
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

## Setup & Run Commands

```bash
npm install
npm run dev      # Starts full-stack Express + Vite server on http://localhost:3000
npm run build    # Production frontend bundle verification
```

## 3-Minute Hackathon Demo Script

1. **Instant Hook (0:00 – 0:35)**: Click **Load Demo Event Instantly** (`Vatsala & Krishnan's 50th Golden Wedding Anniversary · 120 Guests · ₹5,00,000 · Bengaluru`). Point out the cited vendor IDs (`VEN-BLR-01`, `VEN-BLR-04`), South Indian Muhurat advisory (`CUL-01`), and toggle the printable invitation between **English**, **हिन्दी**, and **ಕನ್ನಡ**.
2. **Budget Constraint Solver (0:35 – 1:15)**: Open the **Budget** tab. Show the Donut chart and spent-vs-planned bars. Edit Venue or Catering, click **Pin & Rebalance Others**, and read the KKT solver's trade-off explanation aloud.
3. **Conversational Plan Patching (1:15 – 2:00)**: Click **Refine via Chat** and select *"Reduce total budget by 20% and rebalance"*. Watch the total ceiling drop to `₹4,00,000`, categories rebalance automatically, and the updated cards illuminate with `"Updated via Chat"`.
4. **Timeline, Run Sheet & Live Guest RSVP (2:00 – 3:00)**: Open **Timeline & Run Sheet** to show backward-counted tasks and day-of vendor arrival statuses, then open **Guests & RSVP** → **Open Guest RSVP Portal**, submit a Jain family of 4, and return to see the confirmed headcount & dietary breakdown update live.
