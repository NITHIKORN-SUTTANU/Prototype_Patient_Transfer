# Figma inspection — 25 October 2026

Source: https://www.figma.com/design/umrYKEkwmIdLAq1g1IdLjV

Read-only inspection through Figma MCP: page metadata, actor screen hierarchy, sampled node styles, local variables, prototype reactions, and design-context screenshot of node `9:2`. No Figma edits. Screen names and design intent below are observed; a complete interactive prototype was not verified.

## Pages and screens

| Page (node ID) | Main screens |
| --- | --- |
| 00 · Design System (`0:1`) | Shared components, elderly accessibility guide, Modern Accessible UI example |
| 01 · ACT-01 Citizen / Caregiver (Requester) (`13:2`) | C-01 booking entry; C-02 privacy notice/acknowledgment; C-03A self booking; C-03B other-person booking; C-04 assistance/pickup; C-05 review; C-06 submitted; C-07 status; C-08 bookings; C-09 pickup pin; C-10 approved/pickup time; C-11 rejected; C-12 completed |
| 02 · ACT-01 Validation & Error States (`37:2`) | V-01 invalid details; V-02 consent; V-03 location unavailable; V-04 submitting; V-05 submission failure; V-06 booking list |
| 03 · ACT-02 Dispatcher — Operations (`117:2`) | D-01 dashboard (`153:2`); D-02 vehicle/driver assignment (`117:55`); D-03 monitoring (`117:83`) |
| 04 · ACT-03 Driver — Trips (`117:109`) | R-01 today's active jobs; R-02 active job details; R-03 trip status; R-04 history; R-05 status confirmation; R-01A and R-02A before-start variants |
| 05 · ACT-04 Admin — Management (`117:216`) | A-01 overview; A-02 accounts/permissions; A-03 vehicles; A-04 drivers; A-05 transport history; A-06 settings; A-07 audit log |
| 06 · Staff Login — Shared Authentication (`219:2`) | AUTH-01 desktop; AUTH-02 mobile; authentication-flow reference |

Citizen page separates main flow, active date/time bottom-sheet overlays, and archived full-screen picker references. V-07/V-08 are invalid/disabled legacy pickers. Active overlays include invalid dates/times under the 48-hour rule. Driver's old full-screen R-05 is hidden/deprecated; its popup counterpart is visible.

Dispatcher supporting dialogs: request details, review/rejection confirmation, vehicle and driver dropdowns, resource availability/conflict, assignment confirmation, tracking details and completed job. Admin supporting forms: account add/edit/suspend, vehicle add/edit/disable, driver add/edit/suspend and settings edit.

## Shared foundations

- Components: primary/secondary/rejection buttons; pending/approved/rejected/in-transit badges; normal/required/error fields; walking/wheelchair/stretcher choices; booking summary; three-step booking indicator.
- Font: **Noto Sans Thai**, Regular 400, SemiBold 600, Bold 700. Design-system example uses 32px title, 24px section heading, 18px body, 16–17px field/helper text, 20px action. Citizen entry uses 25px title, 23px card heading, 18px body and 19px actions. Staff samples use 13–16px dense text and 22–28px headings; driver includes 34px time emphasis. These are observed differences, not a single universal type scale.
- Palette variables: white `#ffffff`, ink `#132d2c`, muted `#49635f`, canvas `#f6faf9`, border `#d5e0dc`, primary `#075e57`, hover `#08796c`, teal-100 `#d7f3ec`, teal-50 `#ecf9f5`, warning `#92500a`, warning-bg `#fff2dd`, error `#a72d3b`, error-bg `#fff0f1`, info `#145a95`, info-bg `#e4f0ff`.
- Semantic variables reference palette values for surfaces, text, borders, actions and statuses, with two mode values observed. Mode names were not queried; dark-theme implementation is outside this setup.
- Spacing variables: **4, 8, 12, 16, 20, 24, 32, 48px**. Radius variables: **6, 14, 20, 999px**. Individual screen nodes also use 16/18/22/30px radii and 22px mobile padding. The design-system example has 56px outer padding and 24px section gaps.
- Layouts: citizens are 390px mobile frames with varied content heights; driver main frames 390×900; dispatcher 1440×900; admin generally 1440px desktop; login has desktop/mobile versions.
- Accessibility guide: Thai first, simple language, body text at least 18px, labels 16px, headings 24–30px, touch targets at least 56px, 12–16px separation, status labels alongside colors, actionable errors, emergency 1669 access on booking screens.

## Flows and evidence limits

- ACT-01 intended screen sequence: entry → privacy → patient/appointment (self or other person) → assistance/pickup pin → review → submitted → bookings/status → approved, rejected or completed outcome. Guide specifies advance booking of at least 48 hours and staff approval. Observed reactions open date/time overlays, swap to invalid variants and close overlays. Not every main-flow transition is wired in the inspected reactions.
- ACT-02 intended sequence: dashboard request review → approve/reject → vehicle/driver assignment → resource availability/conflict check → confirmation → monitoring/completion. Supported by screen/dialog names and on-screen labels; do not assume all transitions are wired.
- ACT-03: before-start jobs → job detail → trip-status screen → confirmation popup → history. Observed reactions navigate to detail/status, open the status popup and close/cancel it. Status labels reference starting pickup and hospital delivery. Full operational state transitions remain to be specified during actor implementation.
- ACT-04: overview → management categories → create/edit/suspend/disable forms; history, settings and audit log are separate screens. No prototype reactions were returned for this page.
- Shared staff authentication is a design reference. It will not become real authentication in this prototype. LINE is mentioned in the source login copy but integration is explicitly excluded by project scope.

## Current implementation boundary

The demo actor chooser is a new composition using inspected foundations, not a screen claimed to exist in Figma. ACT-01 was subsequently implemented on 26 October 2026; see [ACT-01-IMPLEMENTATION.md](ACT-01-IMPLEMENTATION.md) for the frame mapping, verification and limitations. Other actor workflows and login remain deferred. Original icon/decorative SVGs are local assets; no Figma screen imagery is used as an implementation asset. Noto Sans Thai is bundled locally via Fontsource.
