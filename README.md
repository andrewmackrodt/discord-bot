# discord-bot 👾

Node.js Discord Bot.

## Features

- AI chat completion using GPT-4
- AI image generation using DALL·E
- Meme creator
- Translate messages to several languages
- Weather report
- ... lot's more fun interactions for your server

Certain features require setting a third-party API key:

- OpenAI (GPT-4 and DALL·E) requires paid [API access](https://platform.openai.com/account/api-keys). Set `OPENAI_API_KEY` in `.env` to enable.
- DeepL (translation) requires free [API access](https://www.deepl.com/account/summary). Set `DEEPL_AUTH_KEY` in `.env` to enable.

## Requirements

**Operating System**: 🍏 macOS or 🐧 Linux. 🪟 Windows has only been tested using WSL2.

**Runtime:** Node 22+, pnpm

**Additional Packages:** imagemagick, graphicsmagick

## Installation

- Ensure Node 20+ and pnpm are available. If Node is not installed or less than the required version, you can run
  `./setup.sh` which will download a compatible runtime using [nvm](https://github.com/nvm-sh/nvm#about).
- Clone the repository and open a terminal in the project directory.
- Run `pnpm install` to download package dependencies.
- Copy `.env.sample` to `.env`.
- If you have an existing discord application you wish to use, set `DISCORD_TOKEN` in `.env`, e.g. `DISCORD_TOKEN=abc`. Otherwise, proceed to the next section.

## Creating an Application for the Bot

- Create a new **Application** using the [Developer Portal](https://discord.com/developers/applications).
- Navigate to the **Bot** section.
- Click **Reset Token** and ensure you **Copy** the token, it can only be viewed once.
- Edit `.env` and set `DISCORD_TOKEN`, e.g. if your token is `abc`, you should set `DISCORD_TOKEN=abc`.
- Disable **Public Bot** under **Authorization Flow**.
- Enable **Message Content Intent** under **Privileged Gateway Intents**.
- Click **Save Changes**.

## Adding the Bot to a Server

- Navigate to the **OAuth2** section of your **Application** from the [Developer Portal](https://discord.com/developers/applications).
- **Copy** the **Client ID**.
- Replace `1122334455` in the following URL with your **Client ID**: `https://discord.com/api/oauth2/authorize?client_id=1122334455&permissions=274877959232&scope=bot`.
- Visit the URL using a browser which is signed in to your Discord account.
- Select the server to add the bot to and then **Authorize**.

For reference, `&permissions=274877959232` in the URL maps to the following permissions:

```
Read Messages/View Channels, Send Messages, Send Messages in Threads, Embed Links, Attach Files, Add Reactions
```

## Usage

Run `pnpm start` to start the bot.

### Additional Commands

| Command                         | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| `pnpm run build`                | Build application for dist (path: `out`)                  |
| `pnpm run build:check`          | Check for type errors                                     |
| `pnpm run check`                | Run all `*:check` commands                                |
| `pnpm run clean`                | Remove files created by the `build` command               |
| `pnpm run format`               | Format code using Prettier                                |
| `pnpm run format:check`         | Check for Prettier errors                                 |
| `pnpm run license:check`        | Check for usage of non FOSS licenses in prod dependencies |
| `pnpm run lint`                 | Format code using ESLint and Prettier                     |
| `pnpm run lint:check`           | Check for ESLint errors (includes Prettier)               |
| `pnpm start`                    | Start the application                                     |
| `pnpm test`                     | Run test suite                                            |
| `pnpm run typeorm -- [options]` | Run TypeORM cli commands                                  |
| `pnpm run vulnerability:check`  | Check for CRITICAL vulnerabilities in prod dependencies   |
| `pnpm run watch`                | Start the application and restart on changes              |
