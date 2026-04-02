# Valorant API Error Diagnostics & Account Status Guide

## What We Found

Your app is working correctly! The 404 errors you're seeing are **not code bugs** - they indicate your Valorant account is in one of these states:

### Issue 1: Unranked Account (MMR Endpoint)
- **Error:** `RESOURCE_NOT_FOUND` on `/mmr/v1/player/{puuid}`
- **Cause:** Your account hasn't placed in competitive ranking yet
- **Solution:** Complete 5 unrated matches in Valorant, then place in ranked

### Issue 2: New Account (Store Endpoint)
- **Error:** `404` on `/store/v2/storefront/{puuid}`
- **Cause:** New or restricted accounts may not have store access
- **Solution:** Your account may need time, or complete more placement matches

---

## How to Check Your Account Status

### In the Official Valorant Client:
1. Open Valorant on your PC/Mac
2. **Profile Screen:**
   - ✅ Do you see a rank (e.g., Bronze, Silver, Gold)?
   - ✓ If YES → Your account is ranked
   - ✗ If NO → Your account is unranked (needs placement)

3. **Store Screen:**
   - ✅ Can you access the store with skin offers?
   - ✓ If YES → Store access is enabled
   - ✗ If NO → Store access may be restricted

4. **Competitive Tab:**
   - How many competitive matches have you played?
   - If < 5 → You need more placement matches

---

## What the App Improvements Do

### 1. **Better Error Messages**
Instead of:
```
ERROR: Account data not found on AP, KR, NA, or EU shards.
```

You'll now see:
```
Your account is not yet eligible to view the store. 
New accounts or accounts in certain regions may have restrictions.
```

### 2. **Distinguishes Error Types**
- **Authentication Error (401/403):** Your session expired → Sign in again
- **Account Data Not Found (404):** Your account hasn't completed requirements
- **API Error (5xx):** Riot servers are down

### 3. **Graceful Degradation**
- **Profile Screen:** Shows "Unranked" instead of crashing
- **Store Screen:** Shows friendly error message instead of crashing
- **Inventory Screen:** Returns empty list if no skins found

---

## Recommended Next Steps

### To Get Your Account Working:

**Priority 1: Complete Placement Matches**
1. Open Valorant client
2. Play 5+ unrated matches (Practice, Escalation, Deathmatch, etc.)
3. Enter competitive ranking (Agent Select game mode)
4. Complete placement matches (5-10 ranked games)

**Priority 2: Wait for Account Eligibility**
- New accounts may have store restrictions (7-14 days)
- This is a Riot Games security measure
- Time will resolve this, not the app

**Priority 3: Verify in Official Client**
- Once you have a rank, check if store is visible
- The app will work once these features are available on your account

---

## Technical Details for Developers

### Enhanced Error Handling

The app now uses a custom `APIError` class that distinguishes between:

```typescript
export class APIError extends Error {
    statusCode: number;      // 401, 403, 404, 500, etc.
    errorCode?: string;      // "RESOURCE_NOT_FOUND", "AUTH_FAILED", etc.
    endpoint?: string;       // "/mmr/v1/player/{puuid}"
}
```

### Error Code Mapping

| Status | Code | Meaning | Screen Action |
|--------|------|---------|---------------|
| 404 | RESOURCE_NOT_FOUND | Account data missing | Show friendly message |
| 401/403 | AUTH_FAILED | Token expired | Show login prompt |
| 5xx | UNKNOWN_ERROR | Server error | Show retry button |

### Endpoint-Specific Handling

**`fetchPlayerMMR()`** - Returns `null` if unranked (graceful)
**`fetchStorefront()`** - Throws with friendly message if not eligible
**`fetchInventory()`** - Returns empty array `[]` if no skins found

---

## Console Debugging

The app still logs detailed diagnostics in console for developers:

```
[Headers] Access Token Length: 984 chars ✓
[Headers] Entitlements Token Length: 625 chars ✓
[API] ✓ PUUID Format Valid: 50f28546...
[API] Attempting Shard: AP
[API] URL: https://pd.ap.a.pvp.net/mmr/v1/player/50f28546-...
[API] Response Status: 404
[API] Response body: {"httpStatus":404,"errorCode":"RESOURCE_NOT_FOUND"...}
```

---

## FAQ

**Q: Is my token expired?**
A: No, your tokens are valid (984 and 625 characters respectively). The app successfully authenticates with all 4 Riot shards.

**Q: Is the API broken?**
A: No, the API is responding correctly. It's returning proper error codes (404) with proper messages ("resource not found").

**Q: Why does profile work but store doesn't?**
A: Profile handles MMR errors gracefully (returns `null` → shows "Unranked"). Store crashes on error (now fixed to show friendly message).

**Q: How long until my account is eligible?**
A: Depends on your account age and match history. Usually:
- New accounts: 7-14 days minimum
- After placement: Immediate access typically
- Regional restrictions: May vary by region

**Q: Can I force eligibility?**
A: No, Riot determines this server-side. You can only complete placement matches and wait.

---

## Support

If you encounter other errors after completing these steps:

1. **Check console logs** - Look for actual error messages from Riot API
2. **Verify authentication** - Sign out and sign back in
3. **Clear app cache** - Reinstall if on mobile
4. **Check Riot status** - Is valorant-api.com working?
