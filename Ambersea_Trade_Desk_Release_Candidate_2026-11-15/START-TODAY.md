# AMBERSEA Trade Desk — Start using your system

**Release:** 2026-11-15 reliability and testing upgrade. This is updated source code, **not a verified live Vercel deployment**. Your existing Supabase data has NOT been changed.

## What works in source

- Private Supabase sign-in with confirmed membership and role restrictions.
- Buyer CRM, contacts, sources, communications, tasks, requirements, supplier records, quotations, order/payments, stock quality/reservations, costing, documents, CSV/XLSX, PDF/report functions.
- Due and overdue reminders appear inside the app. Browser system notifications may show **while the app is open** and permission has been granted.
- The UI distinguishes a **confirmed save** from a **failed refresh after a confirmed save** to help avoid accidental duplicates.
- Correct India-time task dates, RFQ-specific supplier comparisons, procurement stock reservation control, document MIME normalization and a connection configuration check.

**What remains unverified**: a fresh Vercel production build, successful signed-in browser save/reopen, PDF output, document upload, staff-role interactions and mobile layout on this release. The full build could not run in the auditing container because npm packages were unavailable. See `docs/TEST-REPORT-2026-11-15.md`.

## Do this once (recommended route: GitHub → Vercel)

1. Extract this ZIP.
2. Create a **PRIVATE** GitHub repository named `ambersea-trade-desk` and upload the extracted folder contents (not a nested ZIP).
3. GitHub Actions **Verify Ambersea Trade Desk** will run `npm ci`, pure tests, PGlite database tests, and `npm run build`. **Do not deploy for business use if the workflow fails.**
4. In [Vercel](https://vercel.com/new), choose **Add New Project** and import this private GitHub repository.
5. Set framework **Vite**, build command `npm run build`, output directory `dist`.
6. In Vercel Environment Variables configure:
    - `VITE_SUPABASE_URL` = `https://xgjoanqeepaxfstutlfx.supabase.co`
    - `VITE_SUPABASE_PUBLISHABLE_KEY` = the **publishable** API key from your **Ambersea Trade Desk** Supabase project.
    - Do **not** set `sb_secret_`, service-role, SQL/database password, or any other private key in `VITE_` variables.
7. Deploy. If variables were missing when building, add them and select **Redeploy**. The application displays a setup page rather than a blank screen when they are missing.
8. Open **Supabase → Ambersea Trade Desk → Authentication → URL Configuration**. Add your exact `https://...vercel.app` address to Redirect URLs. Set Site URL appropriately without removing redirects you still use.
9. Sign in using your existing confirmed **adhil@ambersea.in** Supabase user and its own password. ChatGPT Sites 403 permissions are separate from Vercel/Supabase login.
10. In a private/incognito browser confirm you cannot read records without signing in.

### Crucial database warning

**Do not run `db/schema.sql` against your live existing Ambersea database.** The database and migrations were already installed. Never point Ambersea at the Delsea Supabase project. The frontend checks the expected Ambersea project ID and will refuse a mismatched connection. If you intentionally create an isolated staging Supabase project, configure the different `VITE_EXPECTED_PROJECT_REF` variable with that staging project ID; update all URLs and keys together.

## Authorization security migration (must verify before adding other staff)

The separate `db/security-membership-revocation-20261115.sql` migration corrects a database access-control weakness: removing an employee from the allowlist must immediately stop their access even if an old profile remains active. **This migration is included in the ZIP but has NOT been applied to live Supabase.** Back up the database and test the migration on a separate Supabase staging project before deploying to Ambersea. A matching migration test is included in `tests/ambersea.database.test.mjs`. A confirmed active admin user is required before installing; don't run the SQL on Delsea. The source includes updated permissions for *new* projects; the live database requires this one-time migration.

## First five-minute functional check

1. Go to Buyer CRM. Record current number of buyers (the live database previously had 46). Add a buyer named **TEST — DELETE AFTER CHECK**, using a clearly fake example and without messaging anyone.
2. Click Save. Check that the confirmation indicates the action succeeded. Refresh the browser and reopen the buyer. Confirm all fields persisted. Delete the fake record when finished if you have admin privileges.
3. Add a task due today titled **TEST — buyer follow-up**; refresh. The bell should display the due task. Mark read. Repeat in a second browser to understand the read-state limitation (stored only in each browser).
4. Click **Enable browser alerts**, grant permission, keep the website open, and check a due alert. No alert is sent when the website is closed.
5. Run `node scripts/smoke-host.mjs https://YOUR-SITE.vercel.app` on a computer with Node 22 to check the website and its static assets. This is an **availability test only**, not a Supabase/login/record test.

## Daily routine after acceptance

- **Morning:** Dashboard → Notifications → overdue buyer follow-ups.
- **New lead:** Buyer CRM → sources/contacts → Outreach → draft → manually send via WhatsApp/WeChat/email → log proof of actual send.
- **New order enquiry:** Requirements/RFQ → source matched supplier offers → Costing → quotation and PDF → approval → evidence of send → actual acceptance → order.
- **Stock:** Receive on hold → quality release → reserve against an order → dispatch with audit trail.
- **Payments:** Record the amount and currency under Orders & payments. Create a dedicated task for payment collection due date; automatic payment reminders are not yet implemented.
- **Backups:** Export JSON for reports, and separately establish a **real Supabase database + private Storage backup/restore** procedure. The JSON alone is not a full restorable backup.

## Not active automatically

Email, WhatsApp or WeChat reminders/sending, background push notifications when the site is closed, automatic FX, AI buyer research/translation, and complete disaster-recovery backups. These require additional providers, scheduled workers, server-side secrets and dedicated tests. **The app does not pretend these services are running.**

## Release qualification

Use with real buyers **only after** the CI build and browser acceptance checks pass. The existing records are persistent in Supabase, but no developer can truthfully certify all workflows solely from source review.
