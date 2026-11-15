# Validation — 14 November 2026

## Completed checks

- TypeScript check and Vite production build.
- 19 automated tests using a disposable PGlite PostgreSQL database and pure commercial calculations. Tests cover unauthorized/management access, self-escalation prevention, Delsea product scope, actual-send evidence, atomic quote creation and totals, commercial approval, revisions, genuine-acceptance order conversion, duplicate conversion, stock quality/demand/overdraw/dispatch, payment currency, recurring tasks, suppression, confirmed allowlist membership, privileged RPC denial, stock import rollback, explicit FX/cost inputs, margin vs markup, commission methods, supplier comparison warnings, CSV injection and unsafe URLs.
- Supabase security advisors returned no lints for both projects after core schema creation. Final advisors are recorded in delivery results.
- Live database queries verified zero visible buyers/products for an authenticated database role without a member identity, in each project.
- Original workbook rows independently inspected and imported. Delsea: 80 prospects, 167 linked source records, 200 unsent drafts, 47 without public email/phone. Ambersea: 46 prospects, 87 linked sources, 123 unsent drafts, 30 without public email/phone. No invented sent communications, quotes or orders.
- Package audit: zero reported vulnerabilities at the time checked.
- Browser: Delsea sign-in page rendered and visually inspected on desktop. No user credentials were entered.
- PDF: a 32-line synthetic quotation produced four pages; first and last pages were visually inspected for table layout, totals, terms and pagination. Synthetic data never entered the live database.

## Verification limits

No user Auth account was created or used. Email signup/confirmation, signed-in UI CRUD, real Storage upload/download and mobile device interaction still require a user account and end-to-end acceptance testing. Responsive CSS exists, but device-level mobile testing is not claimed.

Local SQL tests run PostgreSQL through PGlite with a fixture Auth schema, not Supabase's hosted Auth service or actual object storage. Hosted RLS queries and advisors supplement these tests but do not replace a full authenticated walkthrough.

PDFs list separate attachments; embedded product photos and CJK font coverage are not implemented. Browser import supports CSV/XLSX mapping; the initial research workbook was parsed with openpyxl due to namespace incompatibility in ExcelJS's reader. The app's XLSX reader uses namespace-aware XML parsing.

No AI, email-sending provider, FX feed, external calendar or scheduled backup has been authenticated. Manual workflows are implemented. JSON export is not a complete disaster-recovery mechanism; follow README backup guidance.
