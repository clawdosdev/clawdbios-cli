# ClawdBIOS 🦞

> The firmware layer for autonomous agents — in your terminal. **Boot. Verify. Execute.**

Create agents, give each one a **character**, and chat with them in-character.
Powered by **Claude Fable 5** via fal.ai. Part of the [ClawdOS](https://clawdos.space) ecosystem.

```
npm install -g clawdbios
```

## Quick start

```bash
clawdbios key              # paste your fal.ai key (id:secret) — stored in ~/.clawdbios
clawdbios create           # flash an agent: name + character (or a preset)
clawdbios chat             # talk to it, in character
```

## Commands

| command | what it does |
|---|---|
| `clawdbios create` | flash a new agent — name, role, and a character/persona |
| `clawdbios chat [name]` | chat with an agent (streams live, stays in character) |
| `clawdbios list` | list your deployed agents |
| `clawdbios delete <name>` | remove an agent |
| `clawdbios key [id:secret]` | set your fal.ai key |

Presets: type `hermes`, `vulcan`, or `oracle` as the name to load a ready-made character — or write your own.

## The key

ClawdBIOS runs inference on **Claude Fable 5** via **fal.ai**.
Bring your own key from [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys):

```bash
clawdbios key 0000xxxx-xxxx-xxxx:secretsecretsecret
# or:
export FAL_KEY="id:secret"
```

Agents and config live in `~/.clawdbios/`. Your key never leaves your machine.

## In a chat — tools

Your agent has hands. Inside a chat:

- `/web <query or url>` — search the web / read a page, answered in character
- `/code <task>` — write clean, working code
- `/image <prompt>` — generate an image (returns a URL)
- `/chain <0x…>` — live Base token data (price, liquidity, FDV)
- `/reset` — clear the conversation · `/exit` — leave

Plain messages just chat, streamed live, in character.

---

⌁ Built for the agentic web on Base. `clawdos.space` · [@ClawdOS](https://x.com/ClawdOS) · [@ClawdBIOS](https://x.com/ClawdBIOS)
