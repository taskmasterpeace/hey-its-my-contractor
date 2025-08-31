# Contractor Platform

A mobile-first contractor management system with calendar-centric navigation, meeting intelligence, and real-time communication.

## Architecture Overview

This monorepo contains:

- **web/**: Next.js web application
- **mobile/**: React Native mobile app (Expo)
- **services/**: Backend services
  - `chat/`: Rocket.Chat integration
  - `auth/`: Ory Kratos authentication
  - `docs/`: Document management
  - `uploads/`: File upload service (Uppy + tusd)
- **shared/**: Shared components and utilities
- **deployment/**: Docker and deployment configurations

## Core Features

### Calendar-Centric Design
- Calendar serves as the command center
- All meetings, deliveries, and milestones in one view
- Mobile-first navigation with bottom tabs

### Meeting Intelligence
- Auto-transcription with AssemblyAI
- Action item extraction with dual acknowledgment
- Audio playback with waveform visualization

### Field Documentation
- Mobile photo/voice capture
- Offline-first with resumable uploads
- Weather and GPS integration

### Communication
- Project-specific chat channels
- Real-time messaging with image sharing
- Client portal integration

## Technology Stack

- **Frontend**: React, Next.js, React Native (Expo)
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage)
- **Authentication**: Ory Kratos + Casbin RBAC
- **Deployment**: Vercel + Supabase Edge Functions

## Development Setup

### Prerequisites
- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Git

### Quick Start
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd contractor-platform
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development environment:
   ```bash
   docker-compose up -d
   ```

4. Install dependencies:
   ```bash
   npm install
   ```

5. Start the applications:
   ```bash
   # Start both web and mobile
   npm run dev
   
   # Or individually:
   npm run dev:web    # Next.js web app on http://localhost:3000
   npm run dev:mobile # Expo mobile app
   ```

### Services
- **Web App**: http://localhost:4000 (FieldTime Platform)
- **Mobile App**: Use Expo CLI or QR code
- **Database**: PostgreSQL on localhost:5432
- **Kratos Auth**: Public API on localhost:4433, Admin API on localhost:4434
- **Rocket.Chat**: http://localhost:3001
- **InvoicePlane**: http://localhost:8080 (MIT Licensed Invoicing)
- **MinIO Storage**: http://localhost:9000 (Console: http://localhost:9001)
- **MailHog (Email)**: http://localhost:8025
- **File Upload**: http://localhost:1080

### Database Management
```bash
# View database in container
docker exec -it contractor-postgres psql -U postgres -d contractor_platform

# Reset database (warning: destroys data)
docker-compose down -v
docker-compose up -d postgres
```

### Common Commands
```bash
# Install dependencies for all workspaces
npm install

# Build all projects
npm run build

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## License

MIT License - see LICENSE file for details