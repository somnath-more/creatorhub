# Content performance

## Creator experience

The content library displays thumbnail, title, price, views, completed purchases,
gross revenue, status, and View/Edit/Delete actions. Below 1280px, entries use
cards (two columns on tablets); larger screens use a semantic table. One DOM
representation keeps actions and deletion confirmation consistent across layouts.

Sort content by newest creation date, highest revenue, most purchases, or most
views. Numeric sorts descend and ties use the stable content ID. Search, status
filtering, sorting, and analytics mode are stored in URL parameters and combine.
Unknown sorting and analytics parameters fall back to newest and no activity.

## Demo analytics and calculations

No activity is the default and shows zero views, purchases, and revenue.
Sample activity generates explicitly labeled synthetic data for published content;
drafts and scheduled items remain zero. Fixtures are deterministic by content ID,
independent of current prices and titles, and are not written to localStorage.
These examples are separate from the dashboard's preexisting sample purchases.
No real viewer events or payments are recorded.

`contentAnalyticsRepository.ts` exposes an asynchronous repository interface for
future API integration. `contentPerformance.ts` aggregates views and completed
purchase amounts by content ID, including completed free purchases. Pending,
failed, and unknown-content transactions are excluded. Amounts use integer USD
cents and are formatted only for display. Revenue is gross transaction value;
fees, taxes, refunds, and payouts are outside this demo's accounting model.

Revenue does not multiply the current price by purchase count: past payments can
have different prices. The repository's sample amounts also remain unchanged
when content prices change. Production aggregates must preserve content identity
and transaction history even when published content returns to Draft; the sample
adapter's published-only generation is a demonstration rule, not a production rule.

## Loading and recovery

Content and analytics load independently. Pending analytics show a loading message
and unavailable-value marks, rather than fabricated zeros. Simulate analytics
error demonstrates a failure while preserving access to content actions. Retry
analytics repeats the request; simulated errors continue until another mode is
chosen. Outdated requests cannot replace results for newer content/modes.
Storage errors retain the content repository's existing retry experience.

## Validation and future integration

Run `npm test`, `npm run lint`, and `npm run build` from `frontend`. Tests cover
transaction aggregation, free purchases, ignored statuses, deterministic fixtures,
numeric sorting, stable ties, URL controls, zero metrics, and error recovery.
Check mobile, tablet, and desktop layouts, long titles, combined filters, and
destructive-action confirmation.

Spring Boot should expose creator-scoped aggregate metrics and server-side
sorting/pagination for large libraries. Dashboard and library should then use
the same authoritative purchase data. The current frontend sorts in memory and
does not add authentication, real payment processing, or backend analytics.
