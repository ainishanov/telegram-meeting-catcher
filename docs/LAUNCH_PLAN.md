# Launch Plan

Goal: make the repo easy to understand, safe to try, and worth starring.

## Positioning

Telegram meetings become calendar events.

Use this message everywhere: README, GitHub description, social preview, launch
posts, and demo captions.

## GitHub Checklist

- Clear README with a strong social preview.
- Working `npm run demo` without credentials.
- `npm run scan -- --limit 50` for dry-run Telegram validation.
- Docker Compose personal instance.
- CI badge after the first workflow run.
- Issue templates for bugs and feature requests.
- Security policy that warns about Telegram sessions.
- First release tag after setup docs are stable.

## Launch Post

Headline: Stop losing meetings inside Telegram.

Short version:

```text
I built Telegram Meeting Catcher.

It watches only the Telegram chats you allow, catches real meeting plans, and
turns them into Google Calendar events.

Self-hosted. Dry-run first. No shared hosted listener.

Repo: https://github.com/ainishanov/telegram-meeting-catcher
```

## Where To Share

- Hacker News `Show HN`
- Indie Hackers
- Reddit communities focused on productivity and self-hosting
- X/Twitter founder build thread
- Telegram founder/operator chats where scheduling pain is common

## What To Build Before A Bigger Push

- Web setup wizard.
- One-click personal cloud deploy.
- Calendar event preview UI.
- More extraction tests from real anonymized examples.
- Short demo video.

The repo should sell one outcome first: fewer missed meetings.
