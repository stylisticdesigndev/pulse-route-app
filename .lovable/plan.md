# PulseRoute: Gap Analysis vs. Leading Driver Apps

Benchmarked against DoorDash Dasher (earnings history, on-time rate, zone-locked/"can't dash here" states) and food/ride driver patterns on Mobbin. Below are the auxiliary screens, empty states, and edge cases PulseRoute is missing. Everything uses existing tokens and components only (AppShell, ScreenHeader, Pill, BigButton, surface/surface-2, primary/warning/success/destructive) — no new colors, fonts, or illustrations.

## What we have today
Shift start + pre-trip, manifest/map, stop detail, navigation/reroute, scanner, proof of service, exception, offline queue, summary/clock-out, parcels, metrics, profile.

## Missing pieces to add

### 1. Empty and end states (highest value, lowest cost)
- Manifest: "No manifest assigned" state — driver on shift with zero stops, with a Refresh action. Today the screen just shows nothing.
- Manifest: end-of-route state upgraded to a proper card ("Route complete — 8 of 8 cleared") leading to summary.
- Parcels: "Nothing loaded yet" state pointing to the scanner.
- Metrics: "No activity yet this shift" state instead of empty zeros/timeline.
- Offline queue: "Everything synced" success state with last-sync timestamp.
- Off-shift lockout: if the driver opens Manifest/Parcels/Metrics with no active shift, show a "You're off shift" card with a Start shift action.

### 2. Failure and retry states
- A shared inline error block (icon + message + Retry) for every data screen, mirroring the Retry pattern used across benchmarked apps. Currently a failed load shows a blank or stuck screen.
- Scanner: "Barcode not on this manifest" rejection state with Retry / Enter manually / Report issue.
- Proof of service: submit failure → keep the capture, offer Retry or Save to queue, so proof is never lost.
- Sync failure: per-item failed badge in the queue with Retry item and Retry all.
- 404 catch-all route styled to match the app rather than the default router page.

### 3. Missing auxiliary screens
- Stop help / support sheet: can't find address, recipient unreachable, unsafe location, contact dispatch — the standard driver escape hatch, reachable from stop detail and navigation.
- Break / pause shift: go unavailable with a timer, blocking new-stop pressure, resume returns to manifest. Standard in every driver app benchmarked.
- Shift history: list of past shifts with stops cleared, exceptions, distance and duration; tapping one opens its summary. Mirrors Dasher's earnings/history hierarchy.
- Performance detail: on-time rate and completion rate with a per-stop breakdown, following Dasher's on-time rate screen structure, driven by our existing delivery events.
- Notifications / dispatch messages: dispatch alerts, reroute notices, manifest updates, with an unread dot on the header.
- Settings: navigation preference, torch default, haptics, units, offline simulation toggle (currently buried), sign-out.

### 4. Edge-case flows
- Undeliverable → return to depot: mark a parcel as return-to-sender and see returns on the summary.
- Partial delivery: deliver some parcels at a multi-parcel stop and log the rest as an exception.
- Reattempt: re-open an exception stop and re-queue it at the end of the route.
- Permission prompts: location and camera denied states with a clear "how to enable" card, instead of a silently broken map or scanner.
- Wrong stop guard: attempting proof of service far from the stop shows a proximity warning requiring confirmation.

## Suggested build order
1. Empty states + shared error/retry block + off-shift lockout + styled 404.
2. Stop help sheet, break/pause shift, permission states.
3. Shift history, performance detail, settings, notifications.
4. Returns, partial delivery, reattempt, proximity guard.

## Technical notes
- New routes: `help.$seq`, `break`, `history`, `history.$id`, `performance`, `notifications`, `settings`, `$` (catch-all).
- New shared components in `src/components/pulse/`: `empty-state.tsx`, `error-state.tsx`, `permission-gate.tsx` — all built from existing shell primitives.
- Data: `shifts` gains break start/end and status `paused`; `packages` gains a `returned` flag; `delivery_events` gains `attempt` for reattempts; a `dispatch_messages` table for notifications. Each with GRANTs and RLS in the same migration.
- Performance/history read from existing `delivery_events` and `shifts` — no duplicated metrics storage.
- Query hooks extend `src/lib/pulse-data.ts`; loading/error branches feed the new shared states.

Tell me which sections to build (or all of it) and I'll implement in that order.
