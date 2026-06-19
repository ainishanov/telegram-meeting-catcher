# Privacy Model

Telegram Ambient Tasks is designed for whitelisted chats, local state, and
confirmation-first automation.

## Defaults

- No chat is watched unless it is explicitly allowed.
- Channels and broadcast-style sources should stay off in hosted products.
- Deterministic extraction runs before any LLM call.
- Ambiguous events are written to review state instead of being created.
- Raw message text is kept only in local state for review and dedupe.

## Sensitive Secrets

Never commit:

- `TG_SESSION_STRING`
- Telegram API credentials
- Google refresh tokens
- real chat exports
- `data/`
- `.env`

## Hosted Product Boundary

The full user-account listener should be an advanced self-hosted mode until the
product has a strong trust layer: encrypted sessions, clear device revocation
instructions, audit logs, chat allowlists, and OAuth verification.

