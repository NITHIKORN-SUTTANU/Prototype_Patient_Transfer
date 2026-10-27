# ACT-01 booking implementation — 26 October 2026

Subsequent integration: [ACT-02 Dispatcher](ACT-02-IMPLEMENTATION.md) now updates these same bookings. Approved/rejected statuses, rejection reasons and assigned demo pickup times are reflected in ACT-01, including cross-tab updates. The original implementation boundary below describes the earlier ACT-01-only delivery.

Source: [ACT-01 Figma file](https://www.figma.com/design/umrYKEkwmIdLAq1g1IdLjV). Read through Figma MCP metadata, design context, screenshots and read-only Plugin API inspection. No Figma modifications.

Open `/booking`, or select ACT-01 on the existing actor chooser and follow “เข้าสู่หน้าจองรถ”. Use fictional data only.

## Implemented frames

| Figma frame | ID | Implementation |
| --- | --- | --- |
| C-01 booking entry | `13:3` | Start booking, saved bookings, three-step guide, emergency link |
| C-02 privacy acknowledgment | `13:33` | Controlled acknowledgment, disabled continue, return home, information modal |
| C-03A self patient information | `13:71` | Required patient name, telephone, hospital, appointment date/time |
| C-03B other patient information | `40:2` | Additional caregiver name, contact phone and relationship; independent controlled values |
| C-04 assistance and pickup | `13:114` | Travel type, exclusive “none” additional assistance, pickup validation and location fallback |
| C-05 review | `13:149` | Actual entered values, edit actions, back, validation and submit |
| C-06 submitted | `13:197` | Unique persisted reference, pending status and navigation |
| C-07 booking status | `13:221` | Saved pending request, pickup-time placeholder and current status |
| Status timeline | `27:2` | Pending timeline integrated below “ความคืบหน้า”; reference places this frame separately on the canvas |
| C-08 saved bookings | `66:207` | Dynamic saved records instead of the reference's two example records |
| C-09 pickup pin | `66:231` | Reference's simulated map surface; pointer/drag and keyboard selection, confirm/back |
| Active date/time overlays | `109:2`, `109:112` | Calendar month navigation; 24 hours, 60 minutes; confirm, cancel, close and Escape |
| Active invalid date/time overlays | `110:2`, `110:114` | Thai inline errors, disabled confirmation, preserved committed values after cancel |
| V-01 | `37:3` | Required and telephone/lead-time errors integrated into the booking form |
| V-02 | `37:20` | Continue requires acknowledgment; no booking saved on dismissal |
| V-03 | `37:35` | Location-unavailable modal and manual simulated-pin fallback |
| V-04 | `37:52` | Submitting state and repeated-submit guard |
| V-05 | `37:65` | Submission-exception retry feedback in review; no simulated network failures |
| V-06 | `37:80` | Empty saved-bookings state |

Also inspected C-10 approved (`66:2`), C-11 rejected (`66:69`), C-12 completed (`66:140`), archived full-screen date/time pickers (`56:2`, `48:2`) and archived V-07/V-08 (`107:2`, `107:166`). The active bottom sheets supersede the archived pickers. The happy path creates pending bookings; staff approval, rejection, resource assignment, pickup-time confirmation and completion are outside this task. Existing non-pending status values receive basic read-only displays; these are not claimed as complete C-10–C-12 workflows.

## Behavior and verification

- Appointment timestamps always use Asia/Bangkok (`+07:00`). The minimum is exactly 48 elapsed hours, inclusive at equality, checked in the pickers, when advancing the form and immediately before saving. The minimum is fixed, not configurable.
- Booking records extend the existing shared store under `ban-klang-transit:demo:v1`. References increment from BK-0001. Refresh and cross-tab subscription use the existing store. Runtime validation rejects malformed saved details. The existing demo reset clears bookings too.
- Draft values remain in React state while navigating backward or editing. Drafts are intentionally not persisted: refreshing an unfinished flow returns to privacy acknowledgment. Saved requests remain available after refresh.
- Native modal dialogs provide focus containment and Escape dismissal; focus returns to the opener. Thai errors use `aria-invalid` and descriptions. Keyboard focus moves to the first invalid field. The demo map accepts arrow keys and Enter/Space.
- The mobile frame stays 390px wide on larger displays; smaller widths reflow. Original SVGs are local in `public/figma`; their intrinsic geometry is preserved. No temporary Figma asset URLs or screenshot images are used as UI.
- Build and ESLint pass. Playwright covers self/caregiver happy paths, persistence, required fields, the exact 48-hour boundary, disabled date/time confirmations, full time range, cancel/Escape, review edits, back navigation, duplicate submission, multiple references, malformed/blocked storage, route guards, assets and overflow at 320/390/768/1440px. Existing actor-chooser tests remain passing.
- Screenshots are generated under `test-results/booking-*.png` for local visual review; screenshots are not a claim of automated pixel-diff equivalence. Chromium is the tested browser.

## Design gaps and demo limits

- Figma defines no hospital option catalog. The dropdown has one explicit demo option, “โรงพยาบาลที่เลือก (จำลอง)”, based on the reference's placeholder. No real hospital names were invented.
- Figma supplies no full privacy notice. The information modal repeats the three provided data-use summaries and discloses that the full notice is absent; it does not create legal text.
- The pickup design is explicitly a simulated area. Stored X/Y percentages identify a point on that surface, not geographic coordinates. There is no real map, reverse geocoding, geolocation request or service-boundary validation. “Use current location” opens the disclosed demo-unavailable fallback. Actual service-area geometry was not supplied.
- No backend, real authentication, LINE notification, approval process or real patient data is involved. The LINE reference copy is retained with an explicit demo disclosure.
- If localStorage is blocked or full, the existing store retains the booking in memory and prominently warns that refresh will lose it. No successful disk persistence is claimed in that case. The submission retry feedback handles application exceptions; there is no network request to fail.
- Back controls on form steps, a saved-list return action on status and the demo footer supplement the reference to support the requested navigation and demo disclosure. Dynamic review content can increase card height. These additions preserve the reference's visual language.
- No deployment, commit or GitHub push was performed.
