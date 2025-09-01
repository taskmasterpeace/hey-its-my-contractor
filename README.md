# Hey, It's My Contractor 🏗️

**AI-Powered Contractor Management Platform with AAD (AI Art Director) Generation System**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/taskmasterpeace/hey-its-my-contractor)
[![GitHub](https://img.shields.io/github/license/taskmasterpeace/hey-its-my-contractor)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/taskmasterpeace/hey-its-my-contractor)](https://github.com/taskmasterpeace/hey-its-my-contractor/stargazers)

## 🎯 Overview

Hey, It's My Contractor is a revolutionary contractor management platform featuring the world's first **AAD (AI Art Director) generation system**. Built for contractors to enhance visual communication with clients through real-time AI image generation and professional project management tools.

### 🔥 Key Features

- **🪄 Magic Wand Enhancement**: Click any image to edit with AI using style references
- **🎨 AI Generator**: Combine multiple reference images into new designs
- **🤖 Smart Model Selection**: Auto-selects optimal AI model based on image count
- **🏪 Multi-Retailer Search**: Home Depot, Lowe's, Wayfair, Ferguson, Houzz integration
- **📱 Professional Branding**: "Loudon Construction" watermarked AI-generated images
- **⬆️ Upload System**: Users can upload images without watermarks
- **🔍 Full Screen Mode**: View generated images in high resolution

## 🚀 Live Demo

**Production URL**: [hey-its-my-contractor.vercel.app](https://hey-its-my-contractor.vercel.app)

### Try the AAD System:
1. **Search**: Find design elements from major retailers
2. **Magic Wand**: Click 🪄 on any image to edit with AI
3. **AI Generator**: Combine multiple references for new designs
4. **Upload**: Add your own images to the library

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Modern icon system

### AI Integration
- **Replicate API** - Real AI image generation
- **Google Nano Banana** - Style transfer and image editing
- **RunwayML Gen4 Turbo** - Multi-image combination
- **Smart Model Selection** - Automatic optimization

### Backend & APIs
- **Google Custom Search** - Retailer image discovery
- **Image Download System** - Local storage for external images
- **Environment Configuration** - Secure API key management

### Deployment
- **Vercel** - Serverless deployment platform
- **GitHub Integration** - Automated deployments
- **Environment Variables** - Secure configuration

## 📁 Project Structure

```
hey-its-my-contractor/
├── web/                          # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── images/          # AAD Generation System
│   │   │   │   └── page.tsx     # Main images interface
│   │   │   ├── api/
│   │   │   │   ├── replicate/   # AI generation API
│   │   │   │   ├── google-images/ # Search integration
│   │   │   │   └── images/      # Image download system
│   │   │   └── layout.tsx       # App layout
│   │   ├── components/
│   │   │   ├── images/          # AAD Components
│   │   │   │   └── MagicWandModal.tsx
│   │   │   ├── dashboard/       # Dashboard widgets
│   │   │   ├── layout/          # Layout components
│   │   │   └── ui/              # Shared UI components
│   │   └── store/               # State management
│   ├── public/
│   │   └── downloaded-images/   # Local image storage
│   ├── package.json
│   └── next.config.js
├── docs/                        # Documentation
├── deployment/                  # Deployment configs
├── services/                    # Backend services
├── shared/                      # Shared utilities
├── REPLICATE-INTEGRATION.md     # AI integration guide
└── README.md                    # This file
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- API Keys (Google Custom Search, Replicate)

### 1. Clone Repository
```bash
git clone https://github.com/taskmasterpeace/hey-its-my-contractor.git
cd hey-its-my-contractor
```

### 2. Install Dependencies
```bash
cd web
npm install
```

### 3. Environment Variables
Create `.env.local` in the `/web` directory:

```bash
# Google Custom Search API
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_CSE_ID=your_custom_search_engine_id

# Replicate AI Generation
REPLICATE_API_TOKEN=your_replicate_api_token
```

### 4. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000/images` to access the AAD system.

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