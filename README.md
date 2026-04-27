# Houdin.ai

A novelty AI mind-reading chatbot. Ask it anything — it already knows the answer.

## How the magic works

Houdin.ai uses a clever prompt-engineering trick to create the illusion of mind reading:

1. The user types their message in a special format:
   ```
   .secret answer., their question
   ```
   For example: `.chocolate., What's my favorite ice cream flavor?`

2. The frontend hides the secret from onlookers by replacing the displayed text with a mystical phrase like _"Master Houdini, read my mind..."_

3. Behind the scenes, the app extracts both pieces and sends them to GPT-4o, which responds as if it divinely knew the answer all along.

The result: anyone watching the screen sees only a mysterious incantation — and then a eerily accurate AI response.

## Tech stack

- **Frontend**: React 18 + TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express
- **Database**: PostgreSQL via Drizzle ORM (Neon serverless)
- **AI**: OpenAI GPT-4o

## Local setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Environment variables

Create a `.env` file in the project root with the following:

```
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=your_postgres_connection_string_here
```

### Run locally

```bash
npm install
npm run db:push   # apply database schema
npm run dev       # start the dev server
```

The app will be available at `http://localhost:5000`.

## Usage

Type your prompt in the format:

```
.answer., question
```

- The text before the comma (wrapped in dots) is the **secret answer** — this is masked on screen.
- The text after the comma is the **visible question** Houdini appears to answer.

Share your screen with a friend, have them think of something, and watch the magic happen.
