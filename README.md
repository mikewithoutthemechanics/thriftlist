# SA Clothing Poster

A fully automated, free clothing listing tool for South African marketplaces. Manage your inventory and post to Yaga, Facebook Marketplace, Gumtree, OLX, and Junk Mail.

## Features

- **Inventory Management** - Add, edit, and track clothing items with photos
- **Multi-Platform Posting** - Post to 5 major South African second-hand marketplaces
- **Browser Automation** - Uses Playwright to automate non-API platforms (all free, no API keys needed)
- **Local SQLite Database** - All data stored locally, no cloud costs
- **Pre-filled Forms** - Automation opens browser windows and pre-fills listing forms where possible

## Supported Platforms

| Platform | Method | Status |
|----------|--------|--------|
| Yaga | Browser Automation | Ready |
| Facebook Marketplace | Browser Automation | Ready |
| Gumtree SA | Browser Automation | Ready |
| OLX SA | Browser Automation | Ready |
| Junk Mail | Browser Automation | Ready |

## Getting Started

### 1. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 2. Add your first item

- Go to **Inventory** → **Add Item**
- Fill in details, upload photos, select platforms
- Save

### 3. Post to marketplaces

- Open an item and click **Post to Platforms**
- Browser windows will open for each selected marketplace
- Log in manually when prompted (first time only)
- Forms are pre-filled with your item details
- Review and submit manually on each platform

### 4. Configure Settings

- Go to **Settings** to save your location and credentials
- Credentials are stored locally in `data/inventory.db`

## Important Notes

- **Security**: Credentials are stored in a local SQLite database without encryption. This app is designed for local use only.
- **Browser Automation**: Platforms without public APIs require manual login. The app automates form filling but cannot fully bypass authentication or CAPTCHAs.
- **Facebook**: May require 2FA. The browser window stays open for you to complete any additional verification.
- **Terms of Service**: Automation may violate some platforms' ToS. Use at your own risk.

## Tech Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS
- SQLite (better-sqlite3)
- Playwright (browser automation)
- Lucide React (icons)
