# Deploy

Run Telegram Meeting Catcher as a private personal worker. Start in dry-run
mode, inspect the output, then enable live calendar writes.

## Product Promise

Private Telegram meetings become calendar events.

## VPS With Docker Compose

1. Clone the repo on your VPS.
2. Create `.env`.
3. Generate Telegram and Google credentials locally.
4. Start the worker.

```bash
git clone https://github.com/ainishanov/telegram-meeting-catcher.git
cd telegram-meeting-catcher
cp .env.example .env
npm install
npm run setup:telegram
npm run setup:google
npm run doctor
npm run scan -- --limit 50
docker compose up --build -d
```

The default Compose command includes `--dry-run`. Remove it from
`docker-compose.yml` only after scan output looks correct.

## Cloud Platforms

Use the included `Dockerfile` on any platform that supports long-running worker
containers.

Required settings:

- persistent volume mounted to `/app/data`;
- environment variables from `.env.example`;
- command `npm run listen -- --dry-run` for the first run;
- command `npm run listen` after validation.

Good personal-instance targets:

- a small VPS;
- Railway worker from Dockerfile;
- Render background worker from Dockerfile;
- Fly.io app with one machine and a volume.

## Live Mode Checklist

- `TMC_ALLOWED_CHATS` contains only chats you trust.
- `TMC_TIMEZONE` is your local IANA timezone.
- `npm run doctor` passes.
- `npm run scan -- --limit 50` catches the right messages.
- `npm run review` has no surprising events.
- `.env` and `data/` are not committed.

## Revoke Access

Telegram:

`Settings -> Devices -> Active sessions`

Google:

Revoke the OAuth app from your Google Account security settings.
