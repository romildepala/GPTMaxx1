# GPTMaxx1 - Mind Reading Agent

## Overview

GPTMaxx1 is a novelty AI chat application that creates the illusion of "mind reading" through a clever prompt engineering trick. Users embed secret answers within specially formatted prompts, and the AI (GPT-4o via OpenAI) responds as if it divinely knew the information all along. The application masks the user's input on the frontend to hide the embedded answer, making it appear magical to observers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and API calls
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with hot module replacement
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Structure**: REST endpoints under `/api/` prefix
- **Development**: tsx for TypeScript execution, Vite middleware for frontend serving

### Core Application Logic
The "mind reading" works through a specific prompt format:
1. User types `.secret answer.` followed by ceremonial text, then `, actual question`
2. Frontend transforms the display to hide the secret (shows "Dearest Artificial General Intelligence..." instead)
3. Backend extracts the hidden answer and question using regex parsing
4. OpenAI API receives both pieces and responds as if it naturally knew the answer

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Current Storage**: In-memory storage implementation (`MemStorage` class)
- **Database Config**: Drizzle Kit configured for PostgreSQL via `DATABASE_URL`

### Database Schema
- **messages**: Stores prompts and responses with timestamps
- **users**: Basic user table (appears unused currently)

## External Dependencies

### AI/LLM Integration
- **OpenAI API**: Used for chat completions with GPT-4o model
- **API Key**: Requires `OPENAI_API_KEY` environment variable
- **Note**: Attached assets reference DeepSeek as an alternative provider

### Database
- **PostgreSQL**: Primary database (Neon serverless compatible)
- **Connection**: Via `DATABASE_URL` environment variable
- **Driver**: `@neondatabase/serverless` for Neon PostgreSQL

### UI Component Library
- **shadcn/ui**: Full component library with Radix UI primitives
- **Theme**: Dark mode, professional variant, configured via `theme.json`

### Key NPM Packages
- `drizzle-orm` / `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Data fetching and caching
- `zod` / `drizzle-zod`: Schema validation
- `wouter`: Client-side routing
- `express-session` with `connect-pg-simple`: Session management (available but may not be active)