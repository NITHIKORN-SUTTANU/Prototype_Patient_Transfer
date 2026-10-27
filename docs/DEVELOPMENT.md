# Development

The original README.md and Git configuration are preserved.

```sh
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
npm run preview
npx playwright install chromium
npm run test:e2e
```

Use Node 22.12+ (verified setup environment: Node 24). Vite serves the local URL printed in the terminal. A static deployment will need SPA fallback to index.html for React Router paths.

## Structure

- `src/pages`: actor chooser, ACT-01 booking flow, ACT-02 dispatcher and not-found page
- `src/components`: shared actor card, booking UI primitives, appointment pickers, dispatcher controls and assignment form
- `src/layouts`: demo header, main area and footer
- `src/data`: actor catalog, typed shared domain contracts, empty seed state
- `src/services`: versioned localStorage store and reactive subscription
- `src/utils`: runtime validation of persisted data
- `src/styles.css`: Tailwind and inspected Figma foundation tokens
- `src/booking.css`: ACT-01 responsive frame and interactive control styles
- `src/dispatcher.css`: ACT-02 desktop layout, responsive panels and dialogs
- `public/figma`: locally downloaded original Figma SVG assets

React Router exposes `/`, `/booking/*`, `/dispatcher/*` and a catch-all page. Select ACT-01 or ACT-02 and follow the workflow link, or open `/booking` or `/dispatcher` directly. Actor choice stays on the landing page and is reflected in a query parameter for demo context; localStorage is authoritative. Query parameters do not authenticate users.

The shared store uses `ban-klang-transit:demo:v1`. It persists selected actor plus booking, driver and vehicle collections across refreshes and synchronizes open tabs through storage events. Collections start empty; ACT-01 adds demo bookings with `demoStore.update`. Future pages should use the same store. Invalid stored state falls back to a fresh seed; blocked storage gracefully uses memory with an on-screen notice. “Start demo again” resets this application's demo state, including saved bookings.

No backend, database, credentials, real authentication, or LINE LIFF. Use fictional data for later demo records. No deployment, commit or push is part of this setup.

See FIGMA-INSPECTION.md for accessed screens, styles, observed interactions and remaining design uncertainties.

See [ACT-01-IMPLEMENTATION.md](ACT-01-IMPLEMENTATION.md) for implemented Figma frames, demo limitations and booking verification.

See [ACT-02-IMPLEMENTATION.md](ACT-02-IMPLEMENTATION.md) for dispatcher frames, shared-store transitions, the fixed 48-hour/20-minute rules and explicit scheduling simplifications.
