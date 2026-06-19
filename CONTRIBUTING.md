# Contributing

Thanks for helping improve Telegram Meeting Catcher.

## Local Setup

```bash
npm install
npm run check
npm run demo
```

Use `npm run scan -- --limit 50` only after setting up Telegram credentials and
`TMC_ALLOWED_CHATS`.

## Pull Requests

- Keep changes small and easy to review.
- Do not include real `.env`, Telegram session strings, chat exports, or local
  `data/` files.
- Add or update tests when extraction, review, dedupe, or calendar behavior
  changes.
- Start live Telegram work with dry-run output.

## Good First Issues

- Add deterministic examples for more date and time formats.
- Improve setup wizard messages.
- Add deploy templates for personal cloud providers.
- Add redacted health checks for long-running workers.
