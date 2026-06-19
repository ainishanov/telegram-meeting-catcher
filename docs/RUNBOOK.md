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
npm run listen -- --dry-run
```

Use dry-run until the audit output matches your expectations.

## Production Shape

1. Create a Telegram API app at `my.telegram.org`.
2. Generate a `TG_SESSION_STRING` locally.
3. Configure `TAT_ALLOWED_CHATS`.
4. Connect Google Calendar OAuth.
5. Run `npm run listen -- --dry-run`.
6. Remove `--dry-run` only after review state is clean.

## Commands

```bash
npm run demo
npm run check
npm run listen -- --dry-run
npm run listen
```

