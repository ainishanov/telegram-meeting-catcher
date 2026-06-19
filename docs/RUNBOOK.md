# Runbook

## Local Demo

```bash
npm install
npm run demo
```

The demo reads `examples/messages.json`, extracts likely events, and prints what
would be created.

## Dry Run Against Telegram

```bash
cp .env.example .env
npm run setup:telegram
npm run setup:google
npm run doctor
npm run scan -- --limit 50
npm run listen -- --dry-run
```

Use dry-run until the audit output matches your expectations.

Set `TMC_TIMEZONE` to your local IANA timezone before live calendar creation.
Examples: `America/New_York`, `Europe/London`, `Asia/Dubai`.

## Backfill Scan

Use scan to check recent messages without starting the long-running listener.

```bash
npm run scan -- --limit 50
```

Scan is always dry-run. It reads only `TMC_ALLOWED_CHATS` and prints the events
that would be created or sent to review.

## Docker Personal Instance

```bash
cp .env.example .env
npm run setup:telegram
npm run setup:google
docker compose up --build
```

The default Docker command runs with `--dry-run`. To go live, remove
`--dry-run` from `docker-compose.yml` after scan output looks correct.

## Production Shape

1. Create a Telegram API app at `my.telegram.org`.
2. Generate a `TG_SESSION_STRING` locally.
3. Configure `TMC_ALLOWED_CHATS`.
4. Connect Google Calendar OAuth with `npm run setup:google`.
5. Run `npm run doctor`.
6. Run `npm run scan -- --limit 50`.
7. Run `npm run listen -- --dry-run`.
8. Remove `--dry-run` only after review state is clean.

## Commands

```bash
npm run demo
npm run check
npm run setup:telegram
npm run setup:google
npm run doctor
npm run scan -- --limit 50
npm run listen -- --dry-run
npm run review
npm run confirm -- <review-id>
npm run skip -- <review-id>
npm run listen
```

## Review Queue

Low-confidence but plausible meetings are written to local review state. They do
not create calendar events until you confirm them.

```bash
npm run review
npm run confirm -- a1b2c3d4
npm run skip -- a1b2c3d4
```

Use `--dry-run` to test confirmation without creating the Google Calendar event:

```bash
node src/index.mjs confirm a1b2c3d4 --dry-run
```
