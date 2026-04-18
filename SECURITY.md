# Security Policy — stalk-market

Part of the Yellow Barn Farm Collective ecosystem. Security is a top priority.

## Reporting a vulnerability
Email Azuraye directly (contact via Yellow Barn Farm), or DM on the YBF ops channel. Do not open public GitHub issues for security reports.

## How secrets are handled
- **Backend (Google Apps Script):** All secrets — Stripe keys, Twilio tokens, webhook signing secrets, SendGrid / email credentials — live in Apps Script's `PropertiesService`. Read via `PropertiesService.getScriptProperties().getProperty('KEY_NAME')`. Never hardcoded.
- **Frontend:** Must contain zero secret material. Apps Script deployment URLs are public by design; all authentication happens server-side.
- **Local dev:** Use `.env.example` as a template. Never commit `.env`.

## Authentication model
- **Public endpoints** (signup, quote, public info): open, rate-limited server-side where possible.
- **Customer endpoints** (my account, subscription mgmt): authenticated via session token / server-side lookup. Never trust client role claims.
- **Admin endpoints**: server-side admin-auth check on every call. Admin role is stored server-side only.
- **Webhook endpoints** (Stripe, Twilio): signature verification required on every invocation.

## Git hygiene
- SSH remotes only (`git@github.com:Rayevoltion/...`). No Personal Access Tokens in `.git/config`.
- `.gitignore` covers `.env`, `.DS_Store`, `node_modules`, editor state, credential files.
- Feature-branch workflow. No direct commits to `main`.
- Pre-push: scan diff for `sk_live_`, `sk_test_`, `whsec_`, `Bearer `, `AKIA`, `ghp_`, private-key headers.

## PII minimization
- Full phone numbers, emails, and addresses are not logged in plaintext where avoidable.
- `PasswordHash`, `StripeCustomerID`, `StripeSubscriptionID` and similar are blocklisted from customer-readable API returns.

## Incident response
1. Rotate the compromised credential.
2. Rewrite git history if needed (`git filter-repo` / GitHub secret-scanning).
3. Document in `~/.ybf-logs/incidents/YYYY-MM-DD-<slug>.md`.
4. Notify Azuraye.

---
_Last updated: 2026-04-17 — security-baseline pass._
