# Match Detail Debug Instructions

## How to Export Logs

1. **Start the app** using Expo
2. **Go to Match History** → Tap any match
3. **Scroll to the bottom** of the match detail screen
4. **Tap "Export Debug Logs"** button
5. **Check the alert message** - it will say logs are saved

## Accessing the Logs

The logs are saved to your device's local storage using AsyncStorage. Here are the ways to access them:

### Method 1: Use Expo Dev Tools (Recommended)
1. In your Expo app, open the developer menu (shake device or Ctrl+M)
2. Look for "Debug" or "AsyncStorage" option
3. View the logs stored in the app

### Method 2: Share via Expo
If sharing is enabled:
1. After tapping "Export Debug Logs"
2. A share menu may appear
3. Share the file to email, cloud storage, etc.

### Method 3: Check Console
1. Keep your terminal/console open while running the app
2. When you tap "Export Debug Logs"
3. Check the console output - all logs are also printed there

## What the Logs Show

The exported logs include:

1. **Player Information**
   - All field names in the player object
   - What's in the player.stats object
   - Full data for first player

2. **Team Data**
   - How many players per team
   - Player structure details

3. **Map Information**
   - Map ID from match details
   - Map lookup results
   - Full map data if available

4. **Timestamps**
   - Exact time each event occurred
   - Helps track execution order

## Steps to Share With Developer

Since the logs are in device storage:

1. **Option A: Copy from Console**
   - Open the terminal/console when running the app
   - When you export logs, all debug messages print there
   - Copy the output and share it

2. **Option B: Share via Alert**
   - The alert popup shows confirmation
   - Share that message with the developer

3. **Option C: Check Terminal Output**
   - Run: `npm start` or `expo start`
   - Look for `[DEBUG]` lines when loading a match
   - Copy those lines to share

## Common Issues & Solutions

**Problem**: Alert says "undefined"
- **Solution**: This was fixed - you should now see "Logs saved to device storage"

**Problem**: Logs don't appear in console
- **Solution**: Make sure you're running the app with the terminal visible

**Problem**: Can't find the logs
- **Solution**: They're in the app's local storage - use Expo dev tools to access

## Quick Example

When you load a match detail screen, you'll see console output like:

```
[DEBUG] ==== MATCH DETAIL DEBUG START ====
[DEBUG] Player Info found
Data: true
[DEBUG] Player Info keys
Data: ["subject", "teamId", "characterId", "stats", ...]
[DEBUG] Player Stats keys
Data: ["kills", "deaths", "assists", ...]
```

**Copy this console output and share it with the developer!**

