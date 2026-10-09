# Dashboard overview

## Scope and sources

The dashboard shows Total Revenue, Revenue This Month, Total Content, and Total
Purchases; a 7/30-day revenue chart; and searchable, paginated recent purchases.

Sales are explicitly labelled demo data and are separate from local content drafts.
The asynchronous dashboard repository generates 30 sample transactions with stable
IDs and dates relative to the current device calendar. It reads actual local drafts
through the existing content repository for Total Content, including all publication
statuses. New content appears in that
metric when returning to the dashboard. Demo purchase data is not persisted.

This dashboard milestone does not add backend analytics, payment processing,
content-performance columns, or purchase entitlement enforcement.

## Calculation rules

- Amounts are integer USD cents; revenue includes Completed purchases only.
- Total Purchases counts Completed transactions; the list also shows Pending and Failed.
- Revenue This Month uses the current device calendar month and year.
- The 7/30-day chart includes today and zero-fills days without completed sales.
- Day boundaries use the device timezone and calendar arithmetic, including across DST.
- Search matches content title, country, or status, case-insensitively.
- Purchase rows are sorted newest first and paginated with five transactions per page.
- Search resets pagination; invalid or excessive page values are clamped.

Search (`q`), page (`page`), and chart period (`range=7` or `range=30`) use URL
parameters and survive reload. Changing the chart period preserves purchase search.
The chart dependency loads separately from the main application. Its accessible
daily-revenue table provides the same underlying data without needing a graph.

## Application states

- `/`: demo sales and actual local draft count.
- `/?demo=empty`: no sample purchases; content count still reflects saved local content.
- `/?demo=error`: simulated repository failure with retry and a sample-dashboard link.
- Corrupt or unavailable draft storage: error feedback, no silent zero content count.
- Loading: skeleton cards and a labelled loading status while the repository resolves.

Desktop uses purchase rows; small screens use cards showing all five required fields.
Range controls, search, and pagination remain touch-accessible.

## Verification

From `frontend`, run `npm test`, `npm run lint`, and `npm run build`.
Tests cover completed-only revenue, calendar boundaries, zero-filled charts,
local draft counts, search/page interactions, accessible data, empty data,
and retry after storage errors. Browser checks cover mobile, tablet, and desktop.

This is a local demo with no account isolation. Backend integration will replace
the mock purchase source and local draft count with authenticated creator aggregates.
User approval is required before pushing the branch or opening the GitHub PR.
