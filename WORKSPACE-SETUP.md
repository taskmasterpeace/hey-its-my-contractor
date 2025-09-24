# Yarn Workspaces Setup

This project uses Yarn Workspaces to manage dependencies across multiple packages in a monorepo structure.

## Project Structure

```
hey-its-my-contractor/
├── packages/
│   └── web/                    # Next.js web application
├── mobile/                     # Expo React Native app
├── shared/
│   ├── types/                  # Shared TypeScript types
│   └── utils/                  # Shared utilities
└── package.json               # Root workspace configuration
```

## Workspaces

- `@contractor-platform/web` - Next.js web application
- `@contractor-platform/mobile` - Expo React Native mobile app
- `@contractor-platform/types` - Shared TypeScript type definitions
- `@contractor-platform/utils` - Shared utility functions

## Getting Started

1. **Install dependencies for all workspaces:**

   ```bash
   yarn install
   ```

2. **Start development servers:**

   ```bash
   # Start web app
   yarn dev

   # Start mobile app
   yarn dev:mobile

   # Start mobile app on iOS simulator
   yarn dev:mobile:ios

   # Start mobile app on Android emulator
   yarn dev:mobile:android
   ```

## Available Scripts

### Development

- `yarn dev` - Start web development server
- `yarn dev:mobile` - Start Expo development server
- `yarn dev:mobile:ios` - Start Expo on iOS simulator
- `yarn dev:mobile:android` - Start Expo on Android emulator

### Building

- `yarn build` - Build all packages
- `yarn build:web` - Build web application only
- `yarn build:mobile` - Build mobile application only

### Testing & Linting

- `yarn test` - Run tests in all workspaces
- `yarn test:web` - Run web tests only
- `yarn test:mobile` - Run mobile tests only
- `yarn lint` - Lint all workspaces
- `yarn lint:fix` - Lint and fix issues
- `yarn type-check` - Type check all workspaces
- `yarn type-check:web` - Type check web only
- `yarn type-check:mobile` - Type check mobile only

### Utilities

- `yarn clean` - Clean build artifacts in all workspaces
- `yarn clean:all` - Clean everything including node_modules
- `yarn workspace:list` - List all workspaces
- `yarn workspace:info` - Show detailed workspace information
- `yarn deps:update` - Update all dependencies
- `yarn deps:dedupe` - Deduplicate dependencies

## EAS Development Client Setup

For proper Expo Go functionality with the workspace setup, you'll need to create a custom development client:

### Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli
# or
yarn global add eas-cli

# Login to Expo
eas login
```

### Building Development Client

```bash
# For iOS (requires Mac with Xcode)
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android
```

### Using the Development Client

1. Install the built app on your device from the EAS dashboard
2. Start Metro bundler: `yarn dev:mobile`
3. Scan QR code with your custom development client (not standard Expo Go)
4. Your app will load with full monorepo support

### Clear Metro Cache

If you encounter issues:

```bash
yarn workspace @contractor-platform/mobile start -- --reset-cache
```

## Working with Workspaces

### Adding Dependencies

**To a specific workspace:**

```bash
# Add to web app
yarn workspace @contractor-platform/web add package-name

# Add to mobile app
yarn workspace @contractor-platform/mobile add package-name

# Add dev dependency
yarn workspace @contractor-platform/web add -D package-name
```

**To root (affects all workspaces):**

```bash
yarn add -W package-name
```

### Running Commands in Specific Workspaces

```bash
# Run any script in a specific workspace
yarn workspace @contractor-platform/web <script-name>
yarn workspace @contractor-platform/mobile <script-name>

# Examples
yarn workspace @contractor-platform/web start
yarn workspace @contractor-platform/mobile expo start --clear
```

### Cross-Package Dependencies

Packages can depend on each other using the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@contractor-platform/types": "workspace:*",
    "@contractor-platform/utils": "workspace:*"
  }
}
```

This ensures:

- Local packages are always linked
- Version consistency across the monorepo
- Proper publishing behavior

## Shared Packages

### @contractor-platform/types

Contains shared TypeScript type definitions used across web and mobile apps.

**Usage:**

```typescript
import { User, Project, CalendarEvent } from "@contractor-platform/types";
```

### @contractor-platform/utils

Contains shared utility functions and API clients.

**Usage:**

```typescript
import { supabase, createClient } from "@contractor-platform/utils";
```

## Package Manager

This project uses Yarn 4.x with the following features:

- **Plug'n'Play (PnP)**: Faster installs and better dependency resolution
- **Zero-installs**: Dependencies are cached in the repository
- **Workspaces**: Native monorepo support

## Troubleshooting

### Clean Install

```bash
yarn clean:all
yarn install
```

### Update Dependencies

```bash
yarn deps:update
yarn deps:dedupe
```

### Workspace Issues

```bash
# List workspaces to verify setup
yarn workspace:info

# Check workspace dependencies
yarn why package-name
```

### TypeScript Issues

```bash
# Check types in all workspaces
yarn type-check

# Check specific workspace
yarn type-check:web
yarn type-check:mobile
```

## IDE Setup

### VS Code

Add to `.vscode/settings.json`:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.includeAutomaticOptionalChainCompletions": true,
  "typescript.workspaceSymbols.scope": "allOpenProjects"
}
```

### File Associations

The workspace setup automatically handles module resolution across packages.
