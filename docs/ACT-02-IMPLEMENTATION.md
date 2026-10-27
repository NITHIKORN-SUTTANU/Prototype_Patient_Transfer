# ACT-02 Dispatcher implementation

Open `/dispatcher`, or select ACT-02 on the actor chooser and follow the dispatcher link. Submit a fictional booking through ACT-01 first. The dispatcher has no separate patient dataset: every row and metric is derived from `ban-klang-transit:demo:v1`.

## Figma inspection and frame mapping

Source: [Ban Klang Patient Transit](https://www.figma.com/design/umrYKEkwmIdLAq1g1IdLjV), page `117:2`. Inspected every ACT-02 top-level screen, dropdown and dialog through Figma MCP metadata, high-fidelity design context and screenshots. Figma was not modified.

| Frame | ID | Implementation |
| --- | --- | --- |
| D-01 dashboard | `153:2` | Original sidebar, metrics, request queue and actions, driven by actual shared bookings |
| D-02 assignment | `117:55` | Waiting-job selection, schedule summary, resource selection, availability and final confirmation |
| D-03 monitoring | `117:83` | Assigned jobs, actual status counts, search, date/status filters and tracking dialog |
| Pending request details | `158:2` | Actual patient/contact, appointment, pickup and assistance; approve/reject/close |
| Waiting-assignment details | `158:46` | Same details, assignment CTA and close after review |
| Approval confirmation | `162:4` | Confirm review or return to details; validates request eligibility again |
| Rejection dialog | `162:13` | Controlled reason, validation, confirm rejection and return to details |
| Vehicle dropdown | `168:2` | Figma's three fictional vehicle names, selection and unavailable states |
| Driver dropdown | `168:16` | Figma's three fictional driver names, selection and unavailable states |
| Resources available | `169:2` | Actual selected resources and computed demo times; continue or edit |
| Schedule conflict | `169:17` | Actual conflicting booking/resource names or unavailable/missing data; return to change selection |
| Final assignment confirmation | `169:28` | Rechecks current shared data before persisting the assignment |
| Tracking template | `173:44` | Read-only schedule, resource and aggregate status from the shared booking |
| Completed-job variant | `176:11` | Read-only completed state when the store contains it; no automatic completion or seeded completed jobs |

ACT-01 approved/rejected reference frames C-10 (`66:2`) and C-11 (`66:69`) were inspected again for the integration. ACT-01 now displays the stored approval/rejection, actual rejection reason and assigned demo pickup date/time, including live updates across tabs and refresh persistence.

The dispatcher references use text and CSS shapes rather than static image assets. Existing locally downloaded ACT-01 assets remain reused. No runtime temporary Figma asset URLs were added.

## State and workflow

1. ACT-01 submits a `pending` booking.
2. Dispatcher opens its details and confirms approval, or rejects it with a nonempty reason.
3. Approved bookings without a schedule appear as “รอจัดตาราง”. Request approval alone does not reserve a vehicle or driver.
4. Dispatcher selects a job, demo vehicle and demo driver. Availability is recomputed when selections or stored resources change.
5. The ready-result dialog leads to a separate final confirmation. Final assignment re-reads persisted data and checks status, eligibility, active resources and conflicts again.
6. An assigned job appears in monitoring. ACT-01 displays its planned pickup time, explicitly marked as simulated.

The existing `BookingStatus` contract is preserved. `approved` plus `schedule`, `vehicleId`, `driverId` and `assignedAt` represents an assigned job; no incompatible `ASSIGNED` status was added. Review stores `reviewedAt` and, for rejection, `rejectionReason`. Schedule records are runtime-validated, including the fixed preparation buffer and timestamp arithmetic. Existing bookings without the new fields remain readable.

On first dispatcher use, three vehicles (`รถคันที่ 01–03`) and drivers (`คนขับ A–C`) are initialized in the shared store if those inventories are empty. Existing inventory is preserved. A persisted initialization flag prevents deliberately empty or inactive inventories from being silently repopulated/reactivated. No patient bookings are seeded. The existing “start demo again” action resets the shared state.

## Fixed rules and explicitly simplified calculations

- **48 hours:** appointment minus original submission time must be at least 48 elapsed hours, inclusive at equality. This uses the same `LEAD_TIME_MS` as ACT-01. It is not recalculated from the later review time. Missing submission timestamps or required appointment/pickup information block approval/assignment with an explanation. Past appointments cannot be newly approved/assigned.
- **20 minutes:** hospital arrival is always appointment minus 20 minutes. The buffer cannot be edited.
- **Demo travel inputs:** the Figma example departs the center at 11:45, picks up at 12:15, arrives at 12:50 and has a 13:10 appointment. Its two example durations, 30 and 35 minutes, are default editable simulation inputs in a collapsed disclosure. They are not claimed to be measured routes or municipal scheduling policy.
- **Arithmetic:** `arrival = appointment − 20 min`; `pickup = arrival − pickup-to-hospital demo minutes`; `departure = pickup − center-to-pickup demo minutes`.
- **Conflict window:** `[departure, appointment)` includes both demo travel legs and the fixed preparation buffer. An overlap with another approved/in-transit job using the same vehicle **or** driver blocks assignment. Exactly adjacent windows do not overlap. A resource already assigned without a recorded window is treated as unverifiable, not silently available. Completed/rejected jobs do not reserve resources.
- Timestamps use actual instants; display uses Asia/Bangkok. Cross-midnight calculations retain full ISO dates. The expanded disclosure shows the full checked date/time range.

There is no return journey, route optimization, boarding duration, appointment/service duration, turnaround buffer, capacity model, vehicle/assistance compatibility, driver working hours or geographic service-area calculation. Those rules were not supplied and have not been invented.

## Design adaptations and limitations

- Figma separates request approval and resource assignment; the implementation preserves that flow. Review and assignment are separate persisted actions.
- Figma's rejection frame has a reason placeholder and a return action but no final rejection control. The placeholder becomes an input and a matching confirmation button occupies the vacant action area so the explicitly requested rejection workflow can complete. Whitespace-only reasons are rejected.
- Reference example rows, dates and counts are replaced by actual shared bookings. Empty queues have explanatory text and no fake requests. The monitoring date filter starts unfiltered so newly assigned future bookings are visible; its summary cards still count today's jobs.
- A collapsed editable demo-duration disclosure, modest completion notices, actor-switch links and missing-data messages supplement the reference. Dynamic data may increase card/dialog height. The mobile layout stacks panels and keeps wide tables scrollable inside their container.
- The tracking references distinguish detailed driver milestones. The existing store only has aggregate `approved`, `in_transit` and `completed` states, so the dispatcher does not invent “patient collected” events or automatically advance driver status. Full driver operations are outside this task.
- There is no backend, real staff authentication, GPS, external notification, real patient data or live fleet availability. Resource `active` flags are honored, but resource management belongs to a later actor workflow.
- The localStorage store synchronizes tabs and refreshes persisted state before functional updates. It is not a multiuser transactional database or a distributed scheduling lock. Storage failure preserves the existing in-memory behavior with a visible warning; refresh persistence is not claimed when storage is unavailable.
- There was no push or deployment.

## Verification

The dispatcher tests create their requests through the ACT-01 UI rather than injecting a disconnected booking fixture. Tests cover approval, required rejection reason and cancellation, ACT-01 live status and refresh, inactive/empty inventories, independent vehicle/driver conflicts, preparation-buffer overlap, exactly adjacent windows, final resource/conflict rechecks, persisted-data changes without storage notifications, original-submission lead time, invalid legacy lead time, search/date/status filtering, modal Escape/focus, navigation and overflow at 320/390/768/1440px. Existing ACT-01 and actor-chooser tests remain in the regression suite.

Build, ESLint and Playwright commands:

```sh
npm run build
npm run lint
npm run test:e2e -- --output=test-results/full-check
```

Local review screenshots are written to `test-results/dispatcher-*.png`. These are visual-review evidence, not automated pixel-diff equivalence. Chromium is the tested browser.
