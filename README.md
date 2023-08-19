# discord-bot 👾

Node.js Discord Bot.

## Requirements

**Operating System**: 🍏 macOS or 🐧 Linux. 🪟 Windows has not been tested.

**Runtime:** Node 18+, npm

## Installation

- Ensure Node 18+ and npm are available.
  - If Node is not installed or less than the required version, you can run `./setup.sh` which will download a compatible runtime using [nvm](https://github.com/nvm-sh/nvm#about).
- Clone the repository and open a terminal in the project directory.
- Run `npm install` to download package dependencies.
- Copy `.env.sample` to `.env` and open in a text editor. You **must** set `DISCORD_TOKEN`.

## Usage

Run `npm start` to start the bot.

### Additional Commands

| Command                        | Description                                     |
|--------------------------------|-------------------------------------------------|
| `npm run build`                | Compile prod version to `./out`                 |
| `npm run lint`                 | Run ESLint                                      |
| `npm run lint:fix`             | Run ESLint and attempts fixes                   |
| `npm run typeorm -- [options]` | Run TypeORM cli commands                        |
| `npm run start`                | Start the bot                                   |
| `npm run watch`                | Start the bot and restarts if files are changed |
