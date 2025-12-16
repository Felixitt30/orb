# ORB PROJECT - COMPLETE BACKUP
**Date:** December 15, 2025 20:49
**Version:** 1.0.0
**Purpose:** Complete source code backup for safekeeping

---

## TABLE OF CONTENTS
1. [Project Configuration](#project-configuration)
2. [Main Application Files](#main-application-files)
3. [Components](#components)
4. [Utilities & Libraries](#utilities--libraries)
5. [Public Assets](#public-assets)
6. [Documentation](#documentation)

---

## PROJECT CONFIGURATION

### package.json
```json
{
  "name": "orb",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.4.2",
    "@supabase/supabase-js": "^2.87.1",
    "axios": "^1.13.2",
    "react": "^19.2.0",
    "react-confetti": "^6.4.0",
    "react-dom": "^19.2.0",
    "three": "^0.181.2",
    "zustand": "^5.0.9"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "vite": "^7.2.4",
    "vite-plugin-pwa": "^1.2.0"
  }
}
```

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  server: {
    host: true,
    allowedHosts: 'all'
  }
})
```

### index.html
```html
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport"
    content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no, maximum-scale=1">

  <!-- Primary Meta Tags -->
  <title>Orb Live</title>
  <meta name="title" content="Orb">
  <meta name="description" content="Orb - Your personal dashboard">

  <!-- Theme Colors -->
  <meta name="theme-color" content="#1a1a2e">
  <meta name="msapplication-TileColor" content="#1a1a2e">

  <!-- Favicon & Icons -->
  <link rel="icon" type="image/svg+xml" href="/orb-icon.svg">
  <link rel="icon" type="image/svg+xml" sizes="192x192" href="/icons/icon-192.svg">
  <link rel="icon" type="image/svg+xml" sizes="512x512" href="/icons/icon-512.svg">

  <!-- iOS PWA Configuration -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Orb">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="format-detection" content="telephone=no">

  <!-- iOS Icons -->
  <link rel="apple-touch-icon" href="/icons/icon-180.svg">
  <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.svg">
  <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167.svg">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.svg">

  <!-- Web App Manifest -->
  <link rel="manifest" href="/manifest.json">
</head>

<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>

</html>
```

---

## MAIN APPLICATION FILES

### src/main.jsx
**Location:** `src/main.jsx`
**Purpose:** Application entry point

> NOTE: This file initializes React and renders the App component.
> See actual file at: c:\dev\orb\src\main.jsx

### src/App.jsx
**Location:** `src/App.jsx`
**Purpose:** Main application component with routing and state management

> NOTE: This is the main application component that handles:
> - Authentication flow
> - Onboarding
> - Main app layout
> - 3D Orb rendering
> See actual file at: c:\dev\orb\src\App.jsx

### src/store.js
**Location:** `src/store.js`
**Purpose:** Zustand state management store

**Key Features:**
- Portfolio holdings management
- Price fetching (crypto & stocks)
- Wallet connections (MetaMask, Phantom, Coinbase, Rabby, Core)
- User authentication
- Settings management
- Notifications system
- Analytics tracking

**Wallet Support:**
- MetaMask (Ethereum)
- Phantom (Solana)
- Coinbase Wallet (Multi-chain)
- Rabby Wallet (EVM)
- Core Wallet (Avalanche/AVAX - for Trader Joe)

> NOTE: This is a large file (~900+ lines) containing all app state.
> See actual file at: c:\dev\orb\src\store.js

### src/index.css
**Location:** `src/index.css`
**Purpose:** Global styles and CSS variables

> NOTE: Contains global styling, theme variables, and animations.
> See actual file at: c:\dev\orb\src\index.css

### src/App.css
**Location:** `src/App.css`
**Purpose:** App-specific styles

> NOTE: Contains component-specific styling.
> See actual file at: c:\dev\orb\src\App.css

---

## COMPONENTS

### Component List
All components are located in `src/components/`:

1. **DataSyncLoader.jsx** - Loading screen during data synchronization
2. **EmptyState.jsx** - Empty state UI when no data is available
3. **LegalPages.jsx** - Privacy policy and terms of service
4. **LoginPage.jsx** - Authentication page with wallet & email options
5. **MusicPlayer.jsx** - Background music player component
6. **Onboarding.jsx** - First-time user onboarding flow
7. **OrbInfo.jsx** - Information panel about the orb
8. **PortfolioUI.jsx** - Portfolio management interface
9. **RetroGames.jsx** - Easter egg retro games
10. **SessionExpired.jsx** - Session expiration handler
11. **Settings.jsx** - User settings and preferences
12. **StockTicker.jsx** - Stock/crypto price ticker
13. **UI.jsx** - Main UI overlay components
14. **WalletConnect.jsx** - Wallet connection panel (NEW: includes Trader Joe support)

### Key Component Details

#### WalletConnect.jsx
**Recently Updated:** Added support for 3 new wallets
- Coinbase Wallet (🔵)
- Rabby Wallet (🐰)
- Core Wallet (⛰️) - For Avalanche/Trader Joe

**Features:**
- Auto-fade after 4 seconds
- Collapsible panel
- Shows wallet address and balance
- Connect/disconnect functionality
- Error handling

#### LoginPage.jsx
**Recently Updated:** Added wallet options in 2x3 grid layout
- MetaMask
- Phantom
- Coinbase
- Rabby
- Core (AVAX) - spans full width

**Features:**
- Email magic link authentication
- Wallet connection
- Guest mode
- Offline detection
- Loading states

#### PortfolioUI.jsx
**Features:**
- Add/update holdings
- Real-time value calculation
- Token search
- Balance display with hide option
- Auto-import from connected wallets

#### Settings.jsx
**Features:**
- Orb appearance settings
- Sentiment & data preferences
- Display & accessibility options
- UI behavior controls
- Notification settings
- Privacy & security
- App behavior settings

---

## UTILITIES & LIBRARIES

### src/lib/supabase.js
**Purpose:** Supabase client configuration for backend services

> NOTE: Handles database connections for user data persistence.
> See actual file at: c:\dev\orb\src\lib\supabase.js

---

## PUBLIC ASSETS

### Directory Structure
```
public/
├── icons/           # App icons (various sizes)
├── splash/          # iOS splash screens
├── music/           # Background music files
├── manifest.json    # PWA manifest
├── offline.html     # Offline fallback page
└── orb-icon.svg     # Main app icon
```

### manifest.json
**Purpose:** Progressive Web App configuration

> NOTE: Defines app metadata, icons, and PWA behavior.
> See actual file at: c:\dev\orb\public\manifest.json

### offline.html
**Purpose:** Fallback page when app is offline

> NOTE: Displays when user is offline and service worker is active.
> See actual file at: c:\dev\orb\public\offline.html

---

## DOCUMENTATION

### Project Documentation Files

1. **README.md** - Project overview and setup instructions
2. **WALLET_INTEGRATION_UPDATE.md** - Recent wallet additions documentation
3. **DEPLOYMENT_GUIDE.md** - Deployment instructions
4. **PRE_DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist
5. **PRODUCTION_READY.md** - Production readiness documentation
6. **FEATURE_VERIFICATION.md** - Feature testing guide
7. **QUICK_DEPLOY.md** - Quick deployment guide

### Bug Fix Documentation

1. **BUTTON_CLICK_FIX.md** - Button interaction fixes
2. **INPUT_CLICK_FIX.md** - Input field fixes
3. **PORTFOLIO_DISPLAY_FIX.md** - Portfolio display fixes
4. **PORTFOLIO_FADE_FIX.md** - Portfolio fade animation fixes
5. **SUPABASE_FIX.md** - Supabase integration fixes
6. **UI_CLIPPING_FIX.md** - UI clipping issues fixes

---

## DATABASE SCHEMA

### database/schema.sql
**Purpose:** Supabase database schema

> NOTE: Defines tables for user configs and data persistence.
> See actual file at: c:\dev\orb\database\schema.sql

---

## RECENT UPDATES (December 15, 2025)

### Wallet Integration Expansion
**Added support for:**
1. **Coinbase Wallet** - Multi-chain wallet support
2. **Rabby Wallet** - Advanced DeFi wallet
3. **Core Wallet** - Avalanche network support (for Trader Joe DEX)

**Files Modified:**
- `src/store.js` - Added connection functions and state
- `src/components/WalletConnect.jsx` - Added UI for new wallets
- `src/components/LoginPage.jsx` - Updated login options

**New Balance Tracking:**
- AVAX balance for Core Wallet users
- Multi-chain support for Coinbase and Rabby

---

## DEPLOYMENT INFORMATION

### Current Deployment
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** 18.x or higher

### Environment Variables Required
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## BACKUP NOTES

### How to Restore This Project

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   - Create `.env` file
   - Add Supabase credentials

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

### Important Files to Preserve
- All files in `src/` directory
- `package.json` and `package-lock.json`
- `vite.config.js`
- `index.html`
- All files in `public/` directory
- Database schema in `database/schema.sql`
- All documentation `.md` files

---

## TECHNICAL STACK

### Frontend
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4
- **3D Graphics:** Three.js + React Three Fiber
- **State Management:** Zustand 5.0.9
- **HTTP Client:** Axios 1.13.2

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Wallet connections + Email magic links
- **APIs:** CoinGecko (crypto prices), Yahoo Finance (stock prices)

### Wallet Integration
- **Ethereum:** MetaMask, Coinbase, Rabby
- **Solana:** Phantom
- **Avalanche:** Core (for Trader Joe)

---

## CONTACT & SUPPORT

For questions or issues, refer to the documentation files in the project root.

---

**END OF BACKUP DOCUMENT**

*This backup was automatically generated on December 15, 2025 at 20:49*
*All source files are preserved in their original locations within the project*
*For actual file contents, refer to the file paths mentioned throughout this document*
