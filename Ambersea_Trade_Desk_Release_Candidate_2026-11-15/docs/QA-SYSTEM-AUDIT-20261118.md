# AMBERSEA Trade Desk: Full-system QA and clean-start assessment

**Date:** 18 November 2026  
**Project:** `adhilmohammed12368-netizen/ambersea`  
**Database:** Existing AMBERSEA Supabase project (NOT DELSEA)

## Scope and safety

This release preserves existing production records and changes no customer or order rows by deployment. A *new* empty database is simulated in the PGlite regression test. Creating a separate hosted Supabase QA branch was blocked by a provider charge that requires the account holder's cost approval. **No destructive production reset was performed.**

The live project was inspected with read-only database queries. It contained 47 buyers, 21 contacts, 87 research sources, 126 communication records, one RFQ, two document metadata records and no orders or suppliers at the time of audit. These are actual business records, not disposable demo data. No automatic deletion of these records is authorized in this release.

## Changes in this audit

1. Replace selected-test CI with **all** `npm test` tests, including independent PostgreSQL PGlite workflows.
2. Correct an agency-order test that attempted to write to an intentionally protected `total` column via an unauthorized sales route. Admin-created manual orders leave computed totals to the database.
3. Add a clean-start database test: core tables initially empty, base Ambersea catalog still available, separate admin/sales/outsider permissions.
4. Add `delete_buyer_crm` as a transactional, admin-only operation; deletes a buyer and linked research, communications, contacts and tasks together, but **refuses to erase buyers with RFQs, quotations, orders or trade documents**.
5. Expose a clear no-keyword confirmation in Buyer CRM when only disposable CRM history blocks deletion, showing precisely which linked records will be removed.
6. Add a 17-tab static source-contract test and separate Chrome smoke test, using mocked authenticated data in an isolated Vite build.
7. Apply the security fix to live Supabase membership-role evaluation. Role authorization must match a currently active membership, not a stale profile alone.

## Module audit matrix

| Page | Main workflow | Automated check | Still requires live verification |
| --- | --- | --- | --- |
| Overview | Dashboard, metrics, upcoming actions | DB tests and browser render | Live counts and task notifications |
| Buyer CRM | Add/edit/archive/restore/restart/delete | DB, deletion and UI tests | Real saved buyer and user permissions |
| Sales pipeline | Buyer stages and next actions | Navigation smoke | Real drag/move behavior if introduced |
| Research | Buyer source evidence and contacts | Atomic delete and browser render | External verification of sources |
| Outreach | Contact-specific WhatsApp/email handoff, manual logs | Link validation and browser render | Actual provider send, responses |
| Requirements | Buyer RFQs and product lines | DB and browser tests | Full shipment-specific RFQ |
| Quotations | Immutable quote/version/approval/PDF | DB and browser render | Generated PDFs and live approval |
| Orders & payments | PO, shipment, invoice/payment controls | DB and browser render | Accounting reconciliation |
| Tasks & reminders | Due tasks and recurrence | Unit/DB and browser render | Browser permission and timed alerts |
| Inventory & quality | Stock movement, quality and reservations | DB and browser render | Warehouse-side QA data |
| Supplier CRM | Vendors and verification | DB and browser render | Actual supplier communications |
| Sourcing desk | RFQ-specific supplier comparisons | Unit/DB and browser render | Quote-to-offer matched example |
| Costing & profit | Trading, agency and advanced export models | Unit and browser render | Live FX input and saved scenarios |
| Documents | Upload, signed download, drafts, checklist | Document validation, source and browser render | Storage upload, PDF and expiry in real Auth session |
| Reports & export | CSV/JSON reports | Formula sanitization and browser render | Full snapshot backup and restore |
| Import data | Review and import | DB stock import and browser render | Large CSV/XLSX and failure recovery |
| Settings & team | Roles, membership, approvals | DB access and browser render | Staff login/role changes |

**Interpretation:** A green CI run proves the named automated paths worked in that runner. It does **not** prove live WhatsApp or WeChat sync, complete export-document legality, all real-authenticated browser workflows, or production backup/restore.

## Known limitations and operational restrictions

- **No automatic WhatsApp/WeChat/Zoho inbox synchronization** is installed. Messages opened in external apps are not automatically recorded as sent.
- **No closed-browser push service**; local reminder behavior requires the app open or a separately configured provider.
- **No verified full-system database backup/restore** through the site; JSON exports do not include Storage file bytes, Auth accounts, or a PostgreSQL-restorable snapshot.
- **No live currency feeds**; costs and FX basis must be entered/verified.
- **Legal shipment certificates** are upload-only from authorized issuers; generated PDFs are drafts and require review.
- **Vendor/supplier discovery** does not automatically scrape the internet or verify leads.
- **Clean hosted staging** cannot be provisioned until the provider cost is explicitly approved; keep production data unchanged.
- **Permanent buyer cleanup** intentionally leaves audit history. Complete erasure and compliance retention decisions are separate matters.

## Deployment order

1. Run both GitHub CI workflows on the PR: `Verify Ambersea Trade Desk` and `Ambersea Browser Acceptance`.
2. Ensure the database migration `add_atomic_buyer_crm_deletion_20261118` exists in AMBERSEA Supabase.
3. Merge the GitHub PR after the two workflows pass.
4. Confirm Vercel production build and project domain.
5. Browser-smoke the live authenticated workflows when test-account access exists. Do not claim production acceptance based solely on mock-browser tests.

## What a real destructive reset would require

A full production purge means losing 47 buyer profiles, 87 research sources and 126 communications, as well as other audit and business records. This release deliberately **does not** perform that destructive operation. Obtain a verified, restorable database and Storage backup and explicit approval of the data-loss scope before any purge. A clean *new* hosted environment is preferred, rather than dropping tables or cascading customer records in production.
