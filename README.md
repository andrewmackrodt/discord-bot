# discord-bot

A Node.JS Discord

## Quick Start

```sh
git clone https://github.com/andrewmackrodt/discord-bot.git
cd discord-bot
npm install
cp .env.sample .env
${EDITOR:-editor} .env # set DISCORD_TOKEN in .env
npm run start
```

## npm commands

| Command | Description |
|---|---|
| `build` | Creates the dist build in `./dist` and installs production dependencies |
| `dist` | Creates the dist build in `./dist` |
| `lint` | Runs ESLint |
| `lint:fix` | Runs ESLint and attempts fixes |
| `start` | Starts the project |
| `watch` | Starts the project and reloads if files are changed |
