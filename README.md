# Telegram Meeting Catcher

**Never miss a meeting buried in Telegram.**

Telegram Meeting Catcher watches selected Telegram chats and turns clear meeting
plans into Google Calendar events. You keep chatting as usual. The calendar
fills itself.

## Why It Exists

Important meeting plans get buried in Telegram. This catches them before you
forget.

## What It Does

- Watches only allowed Telegram chats.
- Extracts meetings, calls, demos, and appointments.
- Creates confident events in Google Calendar.
- Sends uncertain events to local review state.
- Dedupes by Telegram source message.
- Runs deterministic parsing before optional AI fallback.

## Quick Demo

```bash
npm install
npm run demo
```

## Product Promise

Less copying. Fewer missed calls. One calendar that stays current.

## Safety First

This repo is built for self-hosted use. Do not connect a full Telegram account
to a hosted service you do not trust.

Start with:

- whitelisted chats only;
- dry-run mode;
- confirmation-first settings;
- local state;
- no channel listening.

See [docs/PRIVACY.md](docs/PRIVACY.md).

## Environment

```bash
cp .env.example .env
```

Required for real Telegram listening:

- `TG_API_ID`
- `TG_API_HASH`
- `TG_SESSION_STRING`
- `TMC_ALLOWED_CHATS`

Required for calendar creation:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

Optional AI fallback:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`

## Public Page Copy

Headline: **Never miss a meeting buried in Telegram.**

Core description: **Telegram meetings become calendar events.**

CTA: **Catch Meeting From Chat**

OG image idea: a Telegram chat on the left, a clean calendar event on the right,
with the large text: **Catch Meetings Before They Disappear**.

## Status

Early public scaffold. The core extraction and calendar adapter are intentionally
small so the trust boundary is easy to audit.
