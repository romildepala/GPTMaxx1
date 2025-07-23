# GPTMaxx1 - Mind Reading Agent

## Overview

GPTMaxx1 is a React-based web application that creates an AI-powered "mind reading" experience. The application implements a unique prompt engineering pattern where users must encode secret information within periods (e.g., `.secret.`) followed by ceremonial text and their actual question after a comma. The AI agent (GPT_MAXX) then responds as if it magically discovered the hidden truth to answer the user's question.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack architecture pattern with:

**Frontend**: React SPA with TypeScript, built using Vite
**Backend**: Express.js server with TypeScript
**Database**: PostgreSQL with Drizzle ORM
**UI Framework**: Radix UI components with Tailwind CSS styling
**State Management**: TanStack Query for server state
**Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **React Application**: Single-page application built with Vite and TypeScript
- **UI Components**: Extensive use of Radix UI primitives styled with Tailwind CSS
- **Styling**: Dark theme with professional variant using CSS custom properties
- **State Management**: TanStack Query for API state management
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Express Server**: RESTful API server with TypeScript
- **Database Integration**: Drizzle ORM with PostgreSQL (configured for Neon Database)
- **AI Integration**: OpenAI API integration for chat completions
- **Session Management**: Memory-based storage implementation
- **CORS Configuration**: Development-friendly CORS setup

### Text Transformation System
The application implements a sophisticated text masking system:
- Users input secrets between periods (`.secret.`)
- Frontend transforms display text to hide secrets with polite ceremonial language
- Backend extracts both the hidden answer and the actual question
- AI responds using the extracted information as if it were divinely revealed

## Data Flow

1. **User Input**: User types prompt with format `.secret., question`
2. **Text Transformation**: Frontend masks the secret portion for display
3. **API Request**: Complete prompt sent to backend via `/api/chat` endpoint
4. **Pattern Extraction**: Backend extracts answer and question from prompt
5. **AI Processing**: OpenAI API processes the extracted information
6. **Response Generation**: AI generates response as GPT_MAXX oracle character
7. **Data Persistence**: Message and response stored in database
8. **UI Update**: Response displayed to user with loading states

## External Dependencies

### Core Dependencies
- **OpenAI**: AI completions using GPT-4o model
- **Neon Database**: PostgreSQL database hosting
- **Radix UI**: Accessible component primitives
- **TanStack Query**: Server state management
- **Tailwind CSS**: Utility-first CSS framework
- **Drizzle ORM**: Type-safe database operations

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the application
- **ESBuild**: Production bundling for server code
- **Replit Plugins**: Development environment integration

## Deployment Strategy

The application is configured for Replit deployment with:

**Development Mode**: 
- Vite development server with HMR
- Express server with hot reload via tsx
- Development-specific middleware and error handling

**Production Build**:
- Vite builds client to `dist/public`
- ESBuild bundles server code to `dist/index.js`
- Static file serving from built assets
- Environment-based configuration switching

**Database Setup**:
- Drizzle migrations in `./migrations` directory
- Schema defined in `shared/schema.ts`
- Database URL configuration via environment variables
- Push-based schema updates for development

The application expects a `DATABASE_URL` environment variable and `OPENAI_API_KEY` for full functionality. The server gracefully handles missing API keys with fallback responses directing users to contact the developer for proper prompt engineering guidance.