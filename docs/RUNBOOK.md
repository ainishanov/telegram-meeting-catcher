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
npm run listen -- --dry-run
```

Use dry-run until the audit output matches your expectations.

## Production Shape

1. Create a Telegram API app at `my.telegram.org`.
2. Generate a `TG_SESSION_STRING` locally.
3. Configure `TMC_ALLOWED_CHATS`.
4. Connect Google Calendar OAuth with `npm run setup:google`.
5. Run `npm run doctor`.
6. Run `npm run listen -- --dry-run`.
7. Remove `--dry-run` only after review state is clean.

## Commands

```bash
npm run demo
npm run check
npm run setup:telegram
npm run setup:google
npm run doctor
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
