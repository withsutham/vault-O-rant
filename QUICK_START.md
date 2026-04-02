# Quick Start Guide

## For Users: Getting vault-O-rant Working

### The Problem
Your Valorant account needs to be set up before the app can show full data.

### The Solution (3 Steps)

#### Step 1: Set Up Your Account 
```
Open Valorant Game Client:
1. Play 5+ Unrated matches
2. Enter Competitive mode
3. Complete placement (5-10 ranked games)
```

#### Step 2: Verify It Works
```
In Valorant Client:
✓ Profile: Do you see a rank?
✓ Store: Can you see skin offers?
✓ Inventory: Do you have skins?
```

#### Step 3: Use the App
```
In vault-O-rant:
1. Sign in with your Riot account
2. All screens should now show data
3. Tap Retry if anything fails
```

### What Each Screen Shows

| Screen | Shows | Requires |
|--------|-------|----------|
| Profile | Your rank, RR, tier | Completion of placement |
| Store | Daily skin offers, Night Market | Account eligibility (7-14 days new) |
| Inventory | Your owned weapon skins | Account setup |
| Matches | Your recent match history | Placement completion |

---

## For Developers: Understanding the Fixes

### Error Handling Chain

```
API Call Fails
    ↓
fetchWithShardFallback() catches error
    ↓
Parses HTTP status + error code
    ↓
Throws APIError with details
    ↓
Component-specific handler catches
    ↓
Shows appropriate message to user
```

### New Error Types

```typescript
// Type 1: Account Not Found (404 RESOURCE_NOT_FOUND)
→ Profile: Returns null (shows "Unranked")
→ Store: Throws friendly error message
→ Inventory: Returns empty array

// Type 2: Authentication Failed (401/403)
→ All screens: Throw auth error message
→ UI: Prompt user to sign in again

// Type 3: Server Error (5xx)
→ Generic error handling
→ Show retry button to user
```

### Key Files to Review

1. **`api/valorantService.ts`** - Core error handling
2. **`app/(tabs)/store/index.tsx`** - Store error handling
3. **`app/(tabs)/profile.tsx`** - Profile error handling
4. **`DIAGNOSTICS.md`** - User troubleshooting guide
5. **`FIX_SUMMARY.md`** - Comprehensive technical summary

---

## Debugging

### Check Console Logs
```javascript
// Token check
[Headers] Access Token Length: 984 chars ✓
[Headers] Entitlements Token Length: 625 chars ✓

// Request attempt
[API] Attempting Shard: AP
[API] URL: https://pd.ap.a.pvp.net/mmr/v1/player/{puuid}
[API] Response Status: 404

// Error details
[API] Response body: {"errorCode":"RESOURCE_NOT_FOUND"}
```

### Common Error Messages

| Message | Cause | Fix |
|---------|-------|-----|
| "Account data not found on all shards" | Unranked | Play ranked matches |
| "Session has expired" | Token invalid | Sign in again |
| "Not yet eligible to view store" | New account | Wait 7-14 days |
| Empty inventory | No skins owned | Buy a skin pass |

---

## Performance & Testing

### Before Optimization
- Generic error messages
- App crashes on API errors
- No error context
- Unclear what user needs to do

### After Optimization
- Specific, friendly error messages
- Graceful error handling
- Full diagnostic logging
- Clear next steps for users

### Testing Checklist
- [ ] Profile loads with/without rank
- [ ] Store shows error when not eligible
- [ ] Inventory shows empty correctly
- [ ] Auth errors prompt to sign in
- [ ] All errors are readable in console

---

## File Structure Summary

```
vault-O-rant/
├── api/
│   ├── valorantService.ts        ← MAIN: Error handling (MODIFIED)
│   └── mappingService.ts         ← Skin/tier mapping
├── app/
│   ├── login.tsx                 ← Login flow (MODIFIED)
│   └── (tabs)/
│       ├── profile.tsx           ← Account rank (MODIFIED)
│       ├── store/
│       │   └── index.tsx         ← Daily offers (MODIFIED)
│       ├── inventory/
│       │   └── index.tsx         ← Owned skins (MODIFIED)
│       └── matches/
│           └── index.tsx         ← Match history (MODIFIED)
├── DIAGNOSTICS.md                ← User guide (NEW)
├── FIX_SUMMARY.md               ← Technical summary (NEW)
└── CHANGELOG.md                 ← Detailed changes (NEW)
```

---

## Next Steps

### Short Term
1. Complete placement in Valorant
2. Restart the app
3. All screens should work

### Long Term
- Monitor console logs for errors
- Use DIAGNOSTICS.md for troubleshooting
- Check FIX_SUMMARY.md for technical details
- Refer to CHANGELOG.md for what changed

---

## Support

### If Something Still Doesn't Work

1. **Check the official Valorant client first**
   - Does your account have a rank there?
   - Can you access the store?

2. **Check the console logs**
   - Look for [API] or [Headers] messages
   - Search for "Response Status: 404"

3. **Read DIAGNOSTICS.md**
   - Has a comprehensive troubleshooting guide
   - FAQ section for common issues

4. **Check Riot API Status**
   - Visit valorant-api.com
   - Check if the API is working

---

## Code Quality Improvements

✅ Better error handling
✅ Improved logging
✅ Graceful degradation
✅ User-friendly messages
✅ Type safety fixes
✅ No crashes on API errors
✅ Clear error categorization

---

## Summary

**What was broken:** Unclear error messages, app crashes
**What was fixed:** Better error handling, graceful UI, helpful messages
**What you need to do:** Complete ranked placement in Valorant
**Timeline:** Once ranked, everything works immediately
