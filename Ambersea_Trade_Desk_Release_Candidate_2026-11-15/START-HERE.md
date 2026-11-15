# AMBERSEA Trade Desk — Go-live guide

**This is the improved source project, not a confirmed live deployment.**

## What changed
- Fixed India-local date calculation.
- Supplier comparison now shows only offers attached to the selected RFQ.
- Procurement users can access the stock reservation action, subject to existing database permissions.
- Added a reminder bell for existing saved tasks, quotation expiry, supplier-offer expiry, orders and shipment ETA.
- Due alerts can trigger browser notifications **while the application is open** after permission is granted. Read state is local to each browser; the underlying tasks/deadlines are in Supabase.
- Added isolated reminder tests and a Vercel deployment configuration.

## Deploy to Vercel (recommended)
1. Use a **private** GitHub repository, upload this folder's source (not `node_modules`, not `.env.local`, and not the ignored private `data/initial-buyer-import.json`).
2. Import the repository at https://vercel.com/new. The framework should be Vite; build `npm run build`, output `dist`.
3. In Vercel Project > Settings > Environment Variables set:
   - `VITE_SUPABASE_URL` to the *Ambersea* project's URL, not Delsea's.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` to the active **publishable** key under Supabase > Project Settings > API Keys. This key is intended for the frontend. **NEVER** paste a service-role/secret key.
4. Deploy. Copy your exact Vercel domain. Update Supabase > Authentication > URL Configuration: add `https://YOUR-VERCEL-DOMAIN` under Redirect URLs (and Site URL where appropriate).
5. Sign in using the already-created confirmed Ambersea user. Do not re-run the included initial database SQL against the existing live database.
6. Open the Bell. Create a trial task due today and verify it appears. Click **Enable browser alerts** to allow operating-system alerts while the site stays open.
7. Complete the acceptance checklist below with **sample** buyer/quote/order records. Do not send test buyer communications.

## Local development
Node.js 22+ recommended. `npm ci`, copy `.env.example` to `.env.local`, configure public project keys, `npm test`, `npm run build`, `npm run dev`.

## Acceptance checklist (must check on deployed URL)
- Sign-in and account access; sign-out; cannot access records when signed out.
- Buyer add, edit, reopen after browser refresh; contact, source, opt-out.
- Create task for today, confirm bell, mark read, complete, recurrence.
- Supplier, RFQ, line items, offer linked to selected RFQ, comparison.
- Costing with explicit costs, expected margin, saved snapshot.
- Quote draft, PDF, approval, send evidence, acceptance and order conversion.
- Order items, shipment, payment, currency validation.
- Stock received, quality released, reserved, dispatched, temperature log.
- Document upload and download; import CSV; export records.
- Role checks for admin, sales and procurement; mobile layout.
- Check RLS isolation between Ambersea and Delsea.

## What is NOT active (requires separate provider credentials and setup)
- Email/WhatsApp/WeChat **automatic** reminders or outreach, persistent push delivery while the website is closed, background cron, live currency FX, AI verification/translation. The app does not falsely claim these exist.
- Reliable backups need actual Supabase database + Storage backups; the JSON export is not a restorable full system snapshot.

## Safety
Don't share or publicly host a copy of the `data/initial-buyer-import.json` file. Vercel builds only the `dist` frontend, which does not include it. Keep repository private.

## Important deployment note

This ZIP contains **source** and excludes the original project’s old `dist/` because it would not include these fixes. Vercel must run a fresh build. Deploying the old `dist/` instead would launch the old version without the reminder bell.
