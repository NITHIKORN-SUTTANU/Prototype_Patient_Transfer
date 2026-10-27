# ACT-03 Driver implementation

Implemented 27 October 2026. Entry: `/driver`, also linked from the ACT-03 role chooser. No push or deployment performed.

## Figma inspection

Source: https://www.figma.com/design/umrYKEkwmIdLAq1g1IdLjV?node-id=117-109

Read-only Figma MCP inspection of the complete ACT-03 page hierarchy, high-fidelity design context and screenshots for every active top-level frame, and prototype reactions through the Plugin API. The page itself cannot produce design context; its child frames were requested individually. No Figma edits.

| Frame | Node | Implementation |
| --- | --- | --- |
| R-01 active dashboard | 123:2 | Today's assignments, active indicator, primary status shortcut, upcoming cards |
| R-02 active details | 123:32 | Pickup, fictional patient/contact, destination, assistance, status shortcut |
| R-03 status | 123:69 | Current state, five milestones, next step, update action |
| R-04 history | 123:101 | Completed trips, date, pickup time, completion badge, details |
| R-05 confirmation popup | 142:2 | Current → next state, confirm, cancel, close and Escape |
| R-01A before starting | 146:2 | Assigned trip cards with detail action |
| R-02A before starting | 146:42 | Assigned details and start action leading to status screen |
| Deprecated full-screen R-05 | 139:2 | Inspected in hierarchy; deliberately excluded because hidden/deprecated |

Observed prototype wiring: active primary card/details navigate to R-03; R-03 opens R-05 as an overlay; popup close/cancel dismiss it; before-start card opens R-02A, whose action leads to R-03. Remaining sequential operations are implemented from R-03's visible milestone labels. No extra operational milestones were added. The source R-03 combines an assigned heading with a highlighted pickup milestone; the implementation uses the persisted milestone consistently for both.

Preserved Noto Sans Thai, teal header/actions, pale canvas, blue active state, 16px cards, time emphasis, text navigation glyphs and three equal tabs. These frames contain text and native geometry, with no image/SVG assets to download. Existing bundled font, shared button/modal, tokens, date formatters, resource initialization and store subscription are reused. The map is an explicitly fictional coordinate grid using ACT-01's stored relative pin, without an external map provider.

## Features and routes

- `/driver`: explicit demo driver selection, today's work, active trips retained across midnight, upcoming work, and assignments on other dates so future ACT-01 requests remain reachable.
- `/driver/details?booking=ID`: assigned patient, phone, pickup, destination, appointment, assistance/extras, vehicle and the complete ACT-02 schedule.
- `/driver/status?booking=ID`: current progress, sequential confirmation and recorded event times. Without an ID, select an active/next assigned trip.
- `/driver/history`: completed assignments scoped to the selected driver, with date and detail access.
- Empty identity, no daily assignments, no open assignments, empty history, missing/unowned job, missing pickup, storage failure, stale confirmation and terminal states.
- Native modal focus handling, focus restoration, Escape/cancel, semantic headings, labeled controls, skip link and status announcements.

Driver identity is stored per tab in sessionStorage (`ban-klang-transit:driver`), survives reloads and does not switch another tab's identity. Failure falls back to memory. This is a demo selector, not authentication or access security. No patient trips are seeded by entering the driver screen. Existing fictional A/B/C resources are initialized using the same idempotent ACT-02 initializer.

## Shared data and integration

The shared localStorage key remains `ban-klang-transit:demo:v1`, version 1. Booking gains an optional backward-compatible `driverProgress` object with `stage` and timestamped `events`. Existing bookings load without migration; legacy in-transit records display pickup progress, and completed records display delivered.

| Driver stage | Shared booking status |
| --- | --- |
| assigned | approved |
| going_to_pickup | in_transit |
| patient_onboard | in_transit |
| going_to_hospital | in_transit |
| delivered | completed |

Updates use the existing store's latest persisted snapshot before committing. The driver service verifies active identity, ownership, schedule, vehicle reference, supported booking status, expected current milestone and terminal state. The caller supplies the displayed current stage, never an arbitrary destination stage. Stale dialogs are disabled, and the service checks again on confirmation. The state validator checks optional progress shape, allowed stages, status agreement and event order/timestamps. Unrelated records/resources remain intact.

ACT-01 and ACT-02 consume their existing shared statuses and update through the existing storage event subscription. Their UI files and behavior were not changed. Their current UI displays broad travel/completed states; the detailed driver milestones remain in ACT-03 and the shared record.

The fixed 48-hour submission lead time and fixed 20-minute preparation buffer remain unchanged. Driver actions neither recalculate assignments nor add routing, tracking, departure-date restrictions or automatic progression.

## Verification

Playwright coverage in `tests/driver.spec.ts`:

- Actual ACT-01 booking UI → ACT-02 approve/assign UI → all four driver updates → patient and dispatcher live updates, reload persistence and completed history.
- Different driver sees no other driver's assignments; selection remains isolated across tabs.
- Cancel leaves shared status unchanged; stale dialogs disable confirmation after another tab updates the job; Escape closes; missing IDs and storage reset recover.
- Dashboard, details, status, empty history, populated history, completed status and confirmation popup at **320, 375, 390, 430, 768, 1024, 1280, 1440 and 1920px**, at 900px viewport height.
- Document overflow, horizontal control bounds and popup bounds asserted. Screenshots generated in `test-results/driver-dashboard-WIDTH.png` and `driver-dialog-WIDTH.png`; mobile dashboard and desktop popup visually reviewed against Figma. At 768px, navigation moves to the top and content adapts to two columns, with bounded desktop content. Mobile content scrolls above fixed navigation; controls wrap instead of clipping.
- Existing ACT-01/02 suites cover lead-time boundaries, preparation buffer, assignment conflicts, stale resource changes, malformed storage, booking validation and regression navigation.

Final command results are recorded after completion below.

## Limitations

- Browser-local prototype; no backend, real login, real GPS, routing, SMS or external map navigation. Use fictional information only.
- Wide layouts and operational empty/error states adapt the inspected mobile design; Figma provides no dedicated tablet/desktop driver frames or every operational error variant.
- Real localStorage events synchronize same-origin tabs. As with the existing store, simultaneous writes have no server transaction/locking guarantees; stale snapshots are re-read, but localStorage is not a multi-user database.
- Historical events are recorded for new driver actions. Legacy records have no fabricated historical timestamps. Completed jobs cannot be advanced again.
- Testing uses Chromium and the specified widths; other browser engines, assistive technology and physical devices were not separately tested.

## Final results

- `npm run build`: passed (TypeScript and Vite production bundle).
- `npm run lint`: passed after removing an unused test helper.
- `npm run test:e2e`: **30 passed**, including 11 driver tests and all existing ACT-01/02/role chooser regressions.
- All nine requested widths passed the driver layout, popup and completed-state checks.
- Sandbox directory permissions prevented the initial Vite launch/build; those commands succeeded with approved execution outside the sandbox. No application configuration changes were needed.
