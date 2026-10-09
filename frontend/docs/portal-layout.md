# Portal layout

This frontend-only milestone adds React Router routes for `/`, `/content`,
`/content/new`, `/verification`, and an unknown-route recovery page.

The shared layout uses a sidebar at widths of 1024px and above. Smaller screens
use an inline, collapsible navigation menu; it closes after selecting a destination.
Navigation uses exact route matching so Content and Create content are not active together.
All pages are placeholders; no authentication, API integration, or account state is implied.

## Component boundaries

- Atom: `Button` provides native button attributes and shared interaction styling.
- Molecule: `PortalNavigation` owns destinations and active link styling.
- Organism: `WorkspacePlaceholder` provides consistent placeholder content.
- Layout: `PortalLayout` owns desktop/mobile navigation and the route outlet.
- Pages: compose route-specific titles, descriptions, and working navigation links.

## Run and verify

From `frontend`, run `npm install`, then `npm run dev`.
Run `npm test`, `npm run lint`, and `npm run build` before submitting changes.
Interaction tests cover direct routes, active links, menu toggling, menu closure,
and unknown-route recovery. Browser checks should cover 375px, 768px, and 1440px widths.

Production hosting must return `index.html` for frontend routes while preserving
API and asset routes. Vite handles this fallback during local development.

Next milestones add real dashboard data, content forms, and verification behavior.
