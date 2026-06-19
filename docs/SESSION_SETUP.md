# Telegram Session Setup

Telegram Meeting Catcher uses MTProto through a normal Telegram client session.
That is powerful and sensitive. Start with a test account if you are unsure.

## 1. Create Telegram API Credentials

1. Open `https://my.telegram.org`.
2. Sign in with your Telegram account.
3. Open `API development tools`.
4. Create an app.
5. Copy `api_id` into `TG_API_ID`.
6. Copy `api_hash` into `TG_API_HASH`.

## 2. Generate A Session String

Use the setup wizard:

```bash
npm install
npm run setup:telegram
```

The script writes `TG_API_ID`, `TG_API_HASH`, and `TG_SESSION_STRING` to `.env`.

## 3. Whitelist Chats

Do not start by listening to everything.

```env
TMC_ALLOWED_CHATS=founder_chat,123456789
```

Use Telegram usernames without `@` or numeric chat IDs.

## 4. First Run

Check your setup:

```bash
npm run doctor
```

Then start with dry-run:

```bash
npm run listen -- --dry-run
```

Remove `--dry-run` only after the output matches what you expect.

## Revoke Access

In Telegram, open:

`Settings -> Devices -> Active sessions`

Terminate the session you created for this project.
