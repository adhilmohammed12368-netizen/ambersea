# Ambersea Trade Desk

Private internal seafood trade operations built with React 19, Vite, TypeScript and Supabase. Ivory, warm-gold and navy styling uses custom responsive CSS. This is independent of delseaexports.in and ambersea.in.

## First administrator account

The deployed application is connected to its own database and private file bucket. The initial authorized admin email is **adhil@ambersea.in**. An authorized email is an allowlist entry, not an existing Auth account.

Choose one setup path in this company's Supabase project:

1. For ongoing employee signup, configure **Authentication → Email/SMTP** with your own provider, and set **URL Configuration** to the deployed private Site URL. Keep email confirmation enabled. Then use “First visit? Create your account” in the app, confirm your email and sign in.
2. For the first account without SMTP, the project owner can use **Authentication → Users → Add user / Create user**, enter the authorized email and their own password, and confirm that user as the administrator. Then sign in to the app. Do not send the password in chat. This does not require disabling email confirmation globally.

Supabase's default email service only delivers to authorized project team addresses and is not a production mail service. Custom SMTP has not been configured. See https://supabase.com/docs/guides/auth/auth-smtp .

`claim_membership()` only assigns a role to a signed-in, confirmed Auth user whose email exists in this project's allowlist. It never trusts user-editable metadata. Existing account role/active state is controlled in Settings → Team members. Disabling a pending authorized email does not disable an already-created profile; disable that member separately.

The hosting audience is owner-only. To onboard employees, the owner must also give those specific people private Site access. An app membership does not bypass hosting access. Both companies have separate users and memberships.

## Local development

Use Node 22 or newer. Run `npm ci`, copy `.env.example` to `.env.local`, fill this project's URL and **publishable** key, then `npm run dev`. Run `npm test` and `npm run build` before deployment.

Publishable keys are intentionally used by browser clients; they do not authorize business data. RLS and confirmed memberships authorize every request. No service-role key, database password, or SMTP secret belongs in a Vite environment variable. The production build contains only the public endpoint and publishable key.

## Database installation and migrations

The live project already has the schema and original workbook import. **Do not rerun installation SQL against it.** SQL files in `db/` are the source for the applied migrations. For a fresh, empty project, apply in this order:

1. `db/schema.sql`
2. `db/workflows.sql`
3. `db/company.sql`
4. `db/storage.sql`
5. `db/import_stock.sql`
6. `db/commercial_controls.sql`

The Supabase hosted migration history records `trade_desk_core`, `reviewed_stock_import`, and `commercial_controls_and_quote_attachments`. For future changes, use a new migration and test against a disposable database first. Never point this app at another company's project.

`data/initial-buyer-import.json` preserves only this company's original imported prospects, source rows, contacts and drafts. It is an import audit snapshot, not a full current database backup or a public asset. It is not included in the static frontend bundle. The live Import results page contains the accepted/rejected/duplicate/incomplete report.

## Everyday workflow

- Buyers: search profiles, add contacts/sources, review evidence, set owner and pipeline stage. “Source recorded” does not mean independently verified. Use opt-out/Do Not Contact to suppress outreach.
- Outreach: choose a buyer, review the saved draft and routing warnings, check the review box, then open email/verified WhatsApp/LinkedIn or copy to WeChat. Links never mark messages sent. Record actual send evidence and buyer replies separately. Schedule an adjustable follow-up task.
- Requirements: create the RFQ header, open it and add product lines. Use kg; convert tonnes by multiplying by 1,000. Use container groups to distinguish mixed vs separate containers. Target prices are optional.
- Quotations: prepare from an RFQ or enter multiple lines. Save an immutable draft. Admin approves when configured. Log an actual send with evidence, then genuine buyer acceptance. Convert an accepted quote to an order with a real PO reference. Revisions preserve prior prices. PDFs list separately provided attachments; upload/link them in Documents.
- Costing: enter total shipment costs, manual FX date/source and target margin. Enter zero explicitly where a cost does not apply. Margin is profit/sales, markup is profit/cost.
- Orders: record line quantities/prices, payment terms, actual costs, shipment data and payments. Line values determine order totals. Only record real accepted orders. Payments must use the order currency.
- Inventory: create a lot at zero, record a receipt, inspect and release quality, then reserve against matching order demand. Dispatch the reservation once. Hook and net ribbonfish are distinct products. All movement history remains auditable.
- Tasks: use list or month view; completing a recurring task creates exactly one next occurrence. No external reminders or messages are sent automatically.
- Imports: map CSV/XLSX headers, review duplicates and invalid rows, and confirm the company. Buyer import is admin-only; stock import is admin/procurement. Imports are limited to 1,000 records per review. Stock starts on quality hold. Partial failures remain in the import report.
- Documents: private bucket, 10 MB maximum, restricted PDF/image/CSV/XLSX types and short-lived download links. Documents can be linked to buyers, orders, lots and quotations.

## Roles and controls

Admin manages team/approvals and can edit all business records. Sales manages buyer/requirement/quote/order workflows. Procurement manages products, suppliers and stock. Both can manage tasks and documents; management is read-only. Database policies enforce these rules even if frontend controls are bypassed. Audit history and stock/quote ledgers have no direct client write permission.

Manual record deletion is admin-only and requires explicit confirmation; dependent records are protected by foreign keys. Commercial documents and stock ledgers are preserved. Keep database backups before any deletion.

## Deployment

Build output is `dist/`, suitable for static hosting. `.openai/hosting.json` binds the private Site identity. The deployed code must use only this company's environment. Configure a custom host with a fallback to `index.html` if introducing URL-based routes later (current navigation is client state).

## Backups and recovery

In Reports, download a full-record JSON snapshot regularly. It contains business tables and audit history, but **not** document bytes, Auth credentials or a complete PostgreSQL restore image. Export document bytes separately using authenticated Storage downloads. Treat exports as confidential.

For disaster recovery use Supabase's database backup/dump tools and separately back up private Storage objects. Confirm the backup features available on your plan; point-in-time recovery is not configured here. Preserve migrations and environment configuration independently. Restore into a new isolated staging project first, restore Storage objects with the same paths, restore authorized memberships, and validate counts/RLS/stock totals before switching the app endpoint. Do not restore one company's data into the other project. JSON snapshots are portable evidence/data exports, not an automated one-click restore.

## Integration status and limits

Active: database persistence, RLS, membership authorization, private bucket configuration, source import, local PDF generation, CSV/XLSX import/export.

Requires owner setup: first Auth account or SMTP, production Auth redirect URLs, and additional hosting access for employees. Actual email delivery, signed-in browser workflows, real document upload/download and mobile device behavior have not been end-to-end verified with a user account.

Not connected: outbound email providers, AI research/writing/translation, live FX, external calendars and company logos. Manual drafts/research/FX/task management work. No claims of automated outreach or AI-verified information are made.

PDFs embed DejaVu fonts (license included), covering Latin/Greek/Cyrillic text. CJK quotation text needs a suitable font extension; use English commercial specifications until added. PDF photo embedding is not implemented: documents are securely linked and listed as separately provided attachments. Supplier matching is a recorded-specification comparison, not a guarantee of availability.

See `docs/VALIDATION.md` for tested behavior and remaining verification.

## Ambersea commercial model

Agency orders record the underlying transaction value in order lines, but management revenue uses only the agreed commission (per kg, percentage or fixed fee). Record the payer and agreement; no undisclosed dual commission assumptions. Principal trades report full sales value, with actual cost recorded separately. Supplier capability is not current availability.


## November 15, 2026 upgrade

See [START-HERE.md](START-HERE.md). The notification bell derives overdue/due reminders from existing Supabase business tables; it does not send background push/email/WhatsApp.


## November 15 reliability/security release

Read `START-TODAY.md` and `docs/TEST-REPORT-2026-11-15.md`. A new migration `db/security-membership-revocation-20261115.sql` is **NOT applied** to the existing live project. Do not treat installation SQL as an upgrade. The source package is a release candidate pending GitHub Actions tests, a fresh production build, and authenticated Vercel browser testing.
