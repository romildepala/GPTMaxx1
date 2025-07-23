# GPTMaxx1 - Mind Reading Agent

## Overview

GPTMaxx1 is a full-stack web application that presents itself as a "mind reading" AI agent. The application uses a clever prompt engineering technique where users must embed secret information between periods in their input, followed by a question. The AI then responds as if it magically "read their mind" by using the hidden information to answer their question.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

This is a full-stack TypeScript application using a modern web stack with the following architecture:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Integration**: OpenAI API (using gpt-4o model)
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (configured for Neon serverless)

## Key Components

### Frontend Components
1. **Home Page** (`client/src/pages/home.tsx`): Main interface with special text transformation logic that disguises user input
2. **Text Transformation**: Clever UI that masks secret text between periods with polite phrases
3. **Chat Interface**: Textarea input with submit functionality and response display
4. **UI Library**: Complete shadcn/ui component set for consistent design

### Backend Components
1. **Chat API** (`server/routes.ts`): Handles `/api/chat` endpoint with prompt parsing and OpenAI integration
2. **Prompt Engineering**: Extracts hidden answers and questions from specially formatted input
3. **Storage Layer** (`server/storage.ts`): In-memory storage implementation for messages and users
4. **Development Server**: Vite integration for hot reloading in development

### Data Flow
1. User types input with format: `.secret.ceremonial text, actual question`
2. Frontend transforms display to hide the secret while preserving actual input
3. Backend extracts the secret answer and question using regex parsing
4. OpenAI API generates response using the secret as "divine truth"
5. Response is stored and returned to frontend for display

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **Build Tools**: Vite, TypeScript, ESBuild
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **UI Components**: Radix UI primitives, Lucide icons
- **State Management**: TanStack Query, React Hook Form
- **Backend**: Express.js, OpenAI SDK
- **Database**: Drizzle ORM, Neon Database serverless driver

### Development Tools
- **Database Migrations**: Drizzle Kit for schema management
- **Development**: tsx for TypeScript execution
- **Replit Integration**: Custom plugins for theme and error handling

## Deployment Strategy

### Environment Configuration
- **Database**: PostgreSQL via `DATABASE_URL` environment variable
- **AI Service**: OpenAI API via `OPENAI_API_KEY` environment variable
- **Development**: Vite dev server with HMR
- **Production**: Static build output served by Express

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: ESBuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations handle schema updates
4. **Deployment**: Single Node.js process serves both API and static files

### Key Features
- **Prompt Engineering**: Special input format with hidden secrets
- **Text Masking**: Frontend disguises secret input while preserving functionality
- **AI Integration**: Uses OpenAI GPT-4o for intelligent responses
- **Responsive Design**: Mobile-friendly interface with dark theme
- **Development Experience**: Hot reloading and error overlay for development

The application creates an illusion of "mind reading" through clever UX design and prompt engineering, making users believe the AI can access hidden information when it's actually provided through a specific input format.