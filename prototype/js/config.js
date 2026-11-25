/* Smart Cash — deployment settings. Safe to commit: a Google OAuth *Client ID* is public (never put a client secret here). */
window.SC_CONFIG = {
  googleClientId: "",   // e.g. "1234567890-abc123.apps.googleusercontent.com" — see docs/GOOGLE_SETUP.md
  allowedDomains: [],   // optional: restrict Google sign-in to these email domains, e.g. ["mycompany.com"]. Empty = anyone (testing).
  aiEndpoint: "",       // your AI proxy URL (server/worker.js on Cloudflare Workers). Never put an API key here.
  payEndpoint: "",      // your payment-gateway proxy (server/pay-worker.js). Provider secret keys live ONLY there.
  appUrl: ""            // optional: your public URL (GitHub Pages) shown in the Share sheet
};
window.SC_PROD = 0;     // the production build (app/build.py) sets this to 1: no sample data
