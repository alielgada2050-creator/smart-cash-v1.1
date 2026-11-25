# Changelog
## v1.3
- **Sample account**: "Try a sample account" on the login screen opens an isolated sandbox (separate storage key, own sample data, guided 6-step tour, Exit button). Your real workspace, documents and Google sync are never touched.
- **PC / tablet mode**: from 900px wide (or forced in Account → Appearance) the bottom bar becomes a side navigation and content uses a wide centered column; sheets stay readable; phone layout is unchanged.
- **Two-way Google Drive sync** (`js/sync.js`): Off / Instant (a few seconds after each change) / Hourly (plus on open and when returning to the app); phone and computer share one file in your own Drive app-data folder; id-based merge (local wins), users/audit/security state are never merged, a pre-merge snapshot allows Undo.
- **Fonts & appearance**: self-hosted Tajawal, Cairo and IBM Plex Sans Arabic (OFL) — no external font request needed; text size (4 steps) and density; saved per device.
## v1.2
- Sign-in protections: progressive throttling without user enumeration, TOTP two-step verification + recovery codes, Google nonce/domain allow-list, 12 h session cap.
## v1.1
- Lighter: Excel/ZIP/QR libraries and 10 non-core languages load on demand; service worker no longer caches cross-origin calls.
- Google: Sign in, Drive backup/restore/auto-backup, Excel export to Drive, **Export to Google Sheets**, **Add reminder to Google Calendar** (per-scope tokens).
- Payments: gateway adapter layer + `server/pay-worker.js` (Moyasar adapter) so payment links become real and reconcile automatically; ZATCA TLV helper. See docs/PAYMENTS.md.
- CI workflow (syntax check, build, secret scan); Pages workflow passes GOOGLE_CLIENT_ID / AI_ENDPOINT / PAY_ENDPOINT.
## v1.0
- Security hardening (PBKDF2, CSP, tamper-evident audit chain, invoice seals), audit rules + AI insights, motion polish, store/desktop packaging.
## v0.9 / v0.8 / v0.7
- Google sign-in & Drive, production build without sample data, workspace setup, document vault, PWA.
