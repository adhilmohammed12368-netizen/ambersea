# Technical validation and acceptance report

**Date:** 15 Nov 2026  
**Product:** AMBERSEA Trade Desk (independent of Delsea)  
**Input:** Latest `Ambersea_Trade_Desk_Ready_2026-11-15.zip` and live read-only Supabase metadata  
**Output:** Release candidate, NOT an E2E-certified production deployment.

## Test results

| Test area | Status | Evidence |
|---|---|---|
| Pure costing, agency commission, spreadsheet safety, RFQ scoping | PASS | Node test suite |
| India-local date, reminders and calendar validation | PASS | Node test suite |
| Save-then-refresh failure isolation | PASS | Node test suite |
| Supabase project ID/invalid publishable key diagnostics | PASS | Node test suite |
| Upload MIME/size/extension consistency | PASS | Node test suite |
| Pure unit tests overall | **24 / 24 PASS** | `npm run test:unit` |
| TypeScript/TSX syntax transpilation | PASS | 11 source TS/TSX files; 0 syntax errors |
| npm dependency-lock manifest | PASS | Root package.json versions match package-lock root dependencies |
| Disposable PostgreSQL/PGlite tests | **BLOCKED, not failed product logic** | `@electric-sql/pglite` missing locally; `npm ci` cannot access npm registry |
| Fresh production type-check + Vite build | **BLOCKED** | npm registry DNS unavailable in this runtime, dependency tree incomplete |
| Authenticated browser CRUD, imports, PDF, private downloads, mobile | **NOT TESTED on upgraded build** | Requires deployed site and authorized sign-in |

PGlite suite includes the original 14 PostgreSQL/RLS tests plus 6 new Ambersea-specific catalog, agency-accounting, supplier-role and visitor-isolation tests. **All 20 are pending execution** by GitHub Actions or another environment where `npm ci` works. Automated CI is supplied at `.github/workflows/verify.yml`. It will run all tests and build before deployment. Do not mark those tests passed until CI is green.

## Live database read-only observations

- Supabase project `xgjoanqeepaxfstutlfx` is the correct Ambersea project.
- 27 public business tables; each has RLS enabled; 93 RLS policies recorded.
- 46 buyer prospects, 21 contacts; 0 tasks, quotes and orders at time of check.
- One private `trade-documents` Storage bucket; core nine stored functions available.
- None of the live buyer records or company tables were modified by this audit/release. The security migration is supplied as source but NOT yet applied.
- The earlier security advisor reported **Leaked Password Protection Disabled**. Review Auth password protection in Supabase dashboard; this warning is not repaired by frontend code.

These numbers are infrastructure/schema checks, **not proof** that all browser workflows succeed.

## Source defects repaired/strengthened

1. **Supplier offer cross-RFQ contamination:** comparisons now require matching RFQ ID and product ID.
2. **Stock reservation permissions:** procurement action is visible where PostgreSQL allows it.
3. **India time:** tasks/reminders use Asia/Kolkata dates; invalid calendar dates rejected.
4. **Duplicate-save risk:** after the action is confirmed, a subsequent refresh failure is reported separately, rather than saying the entire action failed.
5. **Authentication/connection resilience:** session expiry and missing frontend config now produce an actionable message; signout wipes cached in-memory records.
6. **Wrong database risk:** prevents accidental connection to Delsea from the Ambersea release by checking the expected project ref.
7. **Private upload variability:** PDF/image/CSV/XLSX MIME types normalized, disallowed/empty/oversized files rejected in the frontend. Server Storage restrictions remain the final authority.
8. **Agency commission inputs:** rejects missing per-kg quantity, nonfinite figures and percentages >100; safe UI preview.
9. **Deployment checks:** GitHub Actions for tests/typecheck/build and an external hosted-asset smoke test.
10. **Membership revocation:** added a reviewed SQL migration to make allowlist deactivation and role mismatch deny continued access. This is NOT yet applied to the live database; apply with migration tooling after staging verification.
11. **CSV export hardening:** formula-prefixed spreadsheet values are escaped even after whitespace.
12. **Privacy:** the private buyer-import JSON is EXCLUDED from this distribution ZIP. Existing buyer records remain in Supabase.

## Acceptance checklist to execute on a Vercel deployment

- [ ] GitHub Actions `npm ci`, pure tests, 20 PGlite database tests, and `npm run build` all pass.
- [ ] Vercel site returns HTTP 200 with loaded JS/CSS and no browser console errors.
- [ ] Signed-out visitor cannot access CRM records; wrong password fails; correct confirmed admin logs in.
- [ ] User refresh/signout/signin, timed session renewal, and denied membership work.
- [ ] Buyer create/edit/reopen, source/contact, duplicate review and Do Not Contact suppressions work.
- [ ] Tasks due today and recurrence: notification bell; OS browser alert with permission; no false background claim.
- [ ] Two RFQs for same product: sourcing only shows matching RFQ offers.
- [ ] Costing: known INR/USD calculation and saved snapshot; agency-only commission in management revenue.
- [ ] Quote: multi-line draft → PDF → approval → proof of actual send → buyer acceptance → order; revision preserves prior terms.
- [ ] Orders: buyer acceptance, separate item values, payments in correct currency; shipment tracking.
- [ ] Inventory: receipt on hold → quality release → reservation against demand → release/dispatch once → temperature log.
- [ ] CSV/XLSX import with duplicate/invalid row handling, plus CSV/Excel/JSON export; no leaked personal data.
- [ ] Upload/download file to private Storage, wrong MIME/oversized rejected, short-lived signed URL works.
- [ ] Sales/procurement/management/admin permissions; RLS prevents unauthenticated reads and privilege escalation.
- [ ] Mobile at 375px/430px, laptop at 1366px, browser navigation, overflow, dialogs and printable PDF.
- [ ] Real database and Storage backup plus test restore to independent staging project.

## Limits and risks

- **P0:** A successful fresh build and signed-in end-to-end testing are prerequisites to declaring business-ready. No false "100% working" status.
- **P1:** Browser reminders are local-device read states and need the site open for OS delivery. No email/WhatsApp or closed-site push integration exists.
- **P1:** No automatic collection/payment due-date reminders; create ordinary tasks until a safely tested database migration and scheduler are deployed.
- **P1:** Initial 46 buyer research records are **prospects, not all independently verified buyers**.
- **P1:** Current full-record JSON export cannot restore Auth credentials or private Storage bytes. Official backups must be configured and tested separately.
- **P2:** Mobile behavior, multilingual CJK PDF rendering, attachments embedded in PDFs and automatic currency conversion need dedicated development/test setup.

## Release decision

**Ready to upload as a GitHub/Vercel release candidate. Not certified for unrestricted business use until CI and browser acceptance are green.**
