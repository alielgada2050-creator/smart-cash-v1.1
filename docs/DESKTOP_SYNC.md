# PC mode, Drive sync, sample account, fonts (v1.3)

## Sample account
Login screen → **Try a sample account** → pick Individuals / Small establishment / Company. It uses storage key `sc2.state.demo-<plan>` and `sc2.docs` keys prefixed `demo-…`; leaving it (Exit) returns to the login screen. Google sync, Drive backup and production data wipe are disabled while inside it.

## PC / tablet mode
Automatic at ≥ 900px. Account → *Appearance & screen* → Layout: Auto / Phone / PC. Saved in `localStorage["sc2.look"]` (device only).

## Google Drive sync
Requires `GOOGLE_CLIENT_ID` (see GOOGLE_SETUP.md) and linking Google once (consent for Drive app-data). Account → *Sync across devices*:
- **Instant** — ~4 s after a change (needs a valid Google token; tokens last ~1 h, after that tap *Sync now* once).
- **Hourly** — on open, on returning to the app, and every hour while open.
The file is `smartcash-<workspace>.json` in the hidden app-data folder of *your* Google account.

### Honest limits
- Drive is a shared file, not a database. Records are merged by `id` (local wins on a tie, newer `t/at/upd` wins otherwise); deletions do not propagate; two devices that create records at the same moment can produce the same id (counters are merged by max).
- `users`, `audit`, `session`, security counters and 2FA are never merged — add users on one device and use Backup/Restore, or wait for the server phase (Firestore/Worker) described in SYSTEM_ARCHITECTURE.md.
- A browser cannot refresh a Google token silently when the tab is in the background; sync resumes at the next open or **Sync now**.
- Before each merge a snapshot is stored locally; *Undo last merge* restores it.

## Fonts
`prototype/fonts/` (OFL) — Tajawal, Cairo, IBM Plex Sans Arabic, 400/700, Arabic + Latin subsets, loaded only when selected. CSP allows `font-src 'self'`.
