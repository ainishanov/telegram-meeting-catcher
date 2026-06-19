# Personal Cloud Architecture

Telegram Meeting Catcher can become seamless for users, but the safe first
version should give each user an isolated personal instance.

## Product Promise

Private Telegram meetings become calendar events.

## Recommended Path

1. Start with self-hosted Docker Compose.
2. Add a guided web setup wizard.
3. Add one-click deploy templates for a personal VPS or app platform.
4. Add a hosted control plane after trust, billing, and audit logs are ready.

## Why Isolation Matters

A Telegram MTProto session can read private chats allowed by that account. Treat
it like a password. Do not put many users into one shared chat listener process
until secrets, audit logs, revocation, and support flows are mature.

## Personal Instance Model

Each user gets:

- one worker container;
- one encrypted Telegram session;
- one Google OAuth refresh token;
- one private state volume or database schema;
- one allowlist of chats;
- one audit log;
- one clear revoke path.

The worker can run on the user's own VPS, a deploy-from-template platform, or a
managed host you operate.

## Hosted Control Plane

The control plane should not process raw chat streams. It should handle:

- signup and billing;
- setup status;
- encrypted secret storage;
- worker provisioning;
- health checks;
- logs with message text redacted by default;
- revoke and delete-account flows.

The worker should handle:

- Telegram connection;
- allowlist filtering;
- extraction;
- Google Calendar creation;
- local review queue;
- dedupe by Telegram source message.

## Seamless Setup Flow

1. User clicks `Deploy My Catcher`.
2. User connects Google Calendar.
3. User generates a Telegram session in the guided setup.
4. User chooses allowed chats.
5. System runs `doctor`.
6. System runs a dry-run scan.
7. User approves live mode.

This keeps the first success path simple while making the trust boundary visible.

## Launch Sequence

1. Public repo: Docker, CI, setup scripts, dry-run scan.
2. Cloud-ready repo: web setup wizard, encrypted secrets, health endpoint.
3. One-click deploy: Railway, Fly.io, Render, or a small VPS template.
4. Managed cloud: per-user workers, billing, audit logs, support tooling.

Do not start with a shared multi-tenant listener. Start with isolated personal
cloud instances and make the hosted version a control plane around them.
