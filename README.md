# Finance Tracker — Standalone

A real, hosted version of the finance tracker, with one feature the in-Claude
artifact can't do: **holdings that update on their own**, once a day, from a
live stock price — no one has to be there to ask for it.

This is a starting scaffold, not the full feature set of the Claude artifact.
It has working Transactions and Holdings. Everything else (Cards, Budgets,
Goals, Recurring, Vendors, Items, Reports) is modeled in the database schema
(`prisma/schema.prisma`) but not yet built out as pages/API routes — see
"Extending this" at the bottom for how to add them with Claude Code.

## What's actually in here

- **Next.js** app (React + API routes in one project)
- **Prisma** — talks to a Postgres database
- **A cron endpoint** (`/api/cron/update-holdings`) that Vercel calls once a
  day, fetches the current price for any holding with a stock symbol, and
  saves the new value
- **Simple password login** — good enough for a single-person app

## 1. Get the pieces (all free tiers)

1. **Database** — [supabase.com](https://supabase.com) → New Project → copy
   the connection string (Settings → Database → Connection string → URI).
2. **Stock price API key** — [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key)
   → free, instant, no credit card.
3. **A GitHub account** (to deploy via Vercel) and a
   [vercel.com](https://vercel.com) account (sign in with GitHub).

## 2. Run it locally first

```bash
npm install
cp .env.example .env      # then fill in the real values
npm run prisma:push       # creates the tables in your database
npm run dev
```

Open `http://localhost:3000`, log in with the password you set in `.env`.

## 3. Deploy it for real

1. Push this folder to a new GitHub repo.
2. In Vercel: **New Project** → import that repo.
3. Add the same environment variables from `.env` in Vercel's project
   settings (Settings → Environment Variables). Use a **different**
   `DATABASE_URL` only if you made a separate production database — otherwise
   reuse the same Supabase one.
4. Deploy. Vercel will also read `vercel.json` and automatically set up the
   daily cron job for you — nothing extra to configure.
5. Visit your new `https://your-app.vercel.app` URL and log in.

That's it — from here, your holdings with a stock symbol set will refresh
every day on their own, whether or not you ever open the app that day.

## 4. Changing how often it updates

Edit the `schedule` in `vercel.json` (it's a standard cron expression,
`"0 13 * * *"` = 1pm UTC daily = ~9am US Eastern). Push the change and Vercel
picks it up on the next deploy.

## Extending this

The Prisma schema already models Cards, Budgets, Goals, Recurring entries,
Vendors, and Bank Accounts — matching the Claude artifact version. To build
out the pages/API routes for those, the fastest path is **Claude Code**:
point it at this repo and ask it to "add a Cards page and API route
following the same pattern as app/holdings," one feature at a time.

## Security notes

- Never commit your real `.env` file (it's already in `.gitignore`).
- `CRON_SECRET` stops random visitors from hitting your cron endpoint and
  burning your API quota — Vercel sends it automatically once it's set as an
  environment variable named exactly `CRON_SECRET`.
- This uses one shared password for the whole app. Fine for personal use;
  if you ever want per-user accounts, swap in something like NextAuth.
