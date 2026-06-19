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

Install dependencies first:

```bash
npm install
```

Then run a small one-off script in a private local shell:

```bash
node --input-type=module
```

Paste this:

```js
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const apiId = Number(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const rl = readline.createInterface({ input, output });
const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
  connectionRetries: 3,
});

await client.start({
  phoneNumber: () => rl.question("Phone: "),
  password: () => rl.question("2FA password: "),
  phoneCode: () => rl.question("Code: "),
  onError: (error) => console.error(error),
});

console.log(client.session.save());
rl.close();
await client.disconnect();
```

Put the printed string into `.env` as `TG_SESSION_STRING`.

## 3. Whitelist Chats

Do not start by listening to everything.

```env
TMC_ALLOWED_CHATS=founder_chat,123456789
```

Use Telegram usernames without `@` or numeric chat IDs.

## 4. First Run

Always start with dry-run:

```bash
npm run listen -- --dry-run
```

Remove `--dry-run` only after the output matches what you expect.

## Revoke Access

In Telegram, open:

`Settings -> Devices -> Active sessions`

Terminate the session you created for this project.
