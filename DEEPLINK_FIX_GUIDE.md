# Authentication Deep Linking Fix

## Problem
The app was trying to redirect to `http://localhost/redirect` which doesn't work on mobile devices, causing:
- `net::ERR_CONNECTION_REFUSED` error
- "Verification Required" page stuck in WebView
- Login flow unable to complete

## Root Cause
React Native/Expo apps can't access `localhost` URLs. The Riot OAuth server redirects back to the configured redirect URI, but without a proper deep linking scheme, the redirect gets lost.

## Solution Implemented

### 1. **Custom Deep Linking Scheme** (`app.json`)
```json
{
  "expo": {
    "scheme": "vaultrant",
    "android": {
      "package": "com.vaultrant.app"
    },
    "ios": {
      "bundleIdentifier": "com.vaultrant.app"
    }
  }
}
```

This allows the system to route `vaultrant://redirect?...` deep links to your app.

### 2. **Updated Redirect URI** (`constants/RSO.ts`)
```typescript
REDIRECT_URI: 'vaultrant://redirect'
AUTH_URL: 'https://auth.riotgames.com/authorize?...&redirect_uri=vaultrant%3A%2F%2Fredirect'
```

### 3. **Dual-Mode Login Handler** (`app/login.tsx`)

**Deep Link Listener:**
```typescript
const subscription = Linking.addEventListener('url', ({ url }) => {
    if (url.includes('access_token')) {
        handleDeepLinkUrl(url);
    }
});
```

**WebView Fallback:**
```typescript
if (url.startsWith(RSO_CONFIG.REDIRECT_URI) && url.includes('access_token')) {
    // Handle redirect in WebView
    await finalizeLogin(accessToken);
}
```

This provides two layers of handling:
1. **Primary**: Catch deep links system-wide via `Linking` API
2. **Fallback**: Handle redirect within WebView if deep linking isn't triggered

## Expected Flow After Fix

1. **User clicks "Sign in with Riot"** in app
2. **WebView loads** Riot OAuth page
3. **User completes login** and Riot redirects to `vaultrant://redirect?access_token=...`
4. **System recognizes** the deep link and routes it back to the app
5. **Linking listener captures** the token from URL
6. **finalizeLogin()** extracts token and fetches user data
7. **App redirects** to profile screen ✅

## Testing the Fix

### For Expo Go (Development)
```bash
npx expo start --clear
```

The app should:
- Load Riot auth page in WebView
- Accept login credentials
- Show brief loading screen
- Navigate to profile page

### For Android Build (Production)
```bash
eas build --platform android
```

The deep linking will work automatically once the app is built with the custom scheme.

## Verification Checklist

After clearing cache:

- [ ] Login page loads Riot auth
- [ ] Can enter credentials without error
- [ ] After login, WebView doesn't stay stuck on "Verification Required"
- [ ] Logs show `[DeepLink] Received URL:` or `[WebView] Navigation to:`
- [ ] Successfully navigates to Profile page
- [ ] Tokens are saved (can see profile data)

## Logs to Monitor

```
[WebView] Navigation to: vaultrant://redirect?access_token=...
[DeepLink] Extracted access token, finalizing login
[Login] Captured PUUID: 50f28546-...
✓ Navigation to /(tabs)/profile
```

## Files Modified

- `app.json` - Added scheme and package configs
- `constants/RSO.ts` - Changed redirect URI format
- `app/login.tsx` - Added deep link listener
- `app/redirect.tsx` - New deep link handler (fallback)

## Commit
- `4c1d57f` - Fix authentication redirect with custom deep linking scheme
