# vault-O-rant

Mobile companion app for checking VALORANT profile, rank, match history, store offers, and owned inventory in one place.

## Features

- Riot sign-in flow with secure token storage
- Profile view with current rank and player banner
- Match history with detailed match breakdown
- Store view with daily offers, Night Market discounts, and wallet balances
- Inventory view of owned skins

## Tech Stack

- Expo + React Native + Expo Router
- TypeScript
- Riot auth + PD endpoints
- Valorant public content mappings (`valorant-api.com`)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npm run start
```

3. Open on device/emulator:

- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

## Project Structure

- `app/` - Expo Router screens and layouts
- `api/` - Riot API service + data mapping services
- `constants/` - color/theme and RSO config
- `utils/` - secure storage, analytics stubs, error helpers

## Notes

- This project depends on Riot authentication and account eligibility for store/ranked data.
- Some Riot endpoints may return empty/unavailable data depending on account status, region, or queue history.
