# vault-O-rant

Mobile companion app for checking VALORANT profile, rank, match history, store offers, and owned inventory in one place.

This app runs on Expo and follows the React Native + Expo Router

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

## Fundamental Concepts Applied

Based on `fundamental/` materials and examples:

- Mobile app basics and RN foundations (`1. intro_mobileapp.pdf`, `2. RNFundamental.pdf`)
- Basic RN UI/design patterns (`3. RN_BasicDesign.pdf`)
- Touch handling and interaction patterns (`4. handlingTouches.pdf`)
- Firebase concept coverage (`5. Firebase.pdf`)
- List rendering with `FlatList` (`fundamental/index.js`)
- Navigation structure with Expo Router `Stack` + `Tabs` layouts (`fundamental/app/_layout.tsx`, `fundamental/app/(tabs)/_layout.tsx`)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the app:

```bash
npx expo start
```

3. Open on device/emulator

## Project Structure

- `app/` - Expo Router screens and layouts
- `api/` - Riot API service + data mapping services
- `constants/` - color/theme and RSO config
- `utils/` - secure storage, analytics stubs, error helpers
- `fundamental/` - learning sandbox and lesson references used as the project foundation

## Notes

- This project depends on Riot authentication and account eligibility for store/ranked data.
- Some Riot endpoints may return empty/unavailable data depending on account status, region, or queue history.
