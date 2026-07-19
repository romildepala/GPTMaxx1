# Houdin.ai

A novelty AI mind-reading chatbot. You already know the answer — it just looks like the AI does.

![Dark chat interface with Houdin.ai branding](https://github.com/romildepala/GPTMaxx1/raw/main/client/src/assets/houdini_icon.jpg)

## How it works

Type your message in this format:

```
.answer., question
```

The app hides the `.answer.` part on screen, replacing it with *"Master Houdini, read my mind..."*. The AI receives both pieces and responds as if it already knew — confident, no caveats, no hedging.

**Example:**

```
.Inception., What's my favourite film?
```

What the audience sees: *"Master Houdini, read my mind... What's my favourite film?"*  
What the AI gets: the answer + the question → responds like it knew all along.

## Running the trick

1. Ask someone to think of something (a number, a name, a film, anything)
2. Find out the answer without being obvious — have them whisper it or write it down
3. Type `.answer., question` while turned slightly away from the screen
4. Hit send and watch the reaction

## Tech stack

- **Frontend**: React 18 + TypeScript, Tailwind CSS, shadcn/ui, Wouter
- **Backend**: Node.js + Express
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: OpenAI GPT-4o

## Local setup

**Prerequisites:** Node.js 18+, PostgreSQL database, OpenAI API key

```bash
npm install
```

Create a `.env` file:

```
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
```

```bash
npm run db:push   # apply schema
npm run dev       # http://localhost:5000
```
