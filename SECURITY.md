# Security Policy

## Sensitive Data

Never open an issue, pull request, screenshot, or commit containing:

- `TG_SESSION_STRING`
- Telegram API credentials
- Google OAuth refresh tokens
- OpenAI or other LLM API keys
- private chat exports
- local `data/state.json`

## Reporting A Vulnerability

Please do not file public issues for vulnerabilities that expose secrets or
private chat content.

Email the maintainer or open a minimal private advisory with:

- affected version or commit;
- exact behavior;
- reproduction steps without real secrets;
- suggested fix if you have one.

## Recommended Deployment

- Use allowlisted chats only.
- Run dry-run first.
- Keep `.env` and `data/` out of git.
- Use a dedicated Telegram account for testing.
- Prefer one isolated personal instance per user.
- Revoke old Telegram sessions from `Settings -> Devices`.
