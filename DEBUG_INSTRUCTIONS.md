# Match Detail Debug Instructions

## How to Export Logs

1. **Start the app** using Expo (Android, iOS, or web)
2. **Navigate to Match History** - Go to the Matches tab
3. **Tap on any match** to open the detail screen
4. **Scroll to the bottom** of the match detail screen
5. **Tap "Export Debug Logs"** button
6. **An alert will appear** with the file path where logs were saved

## Where to Find the Logs

The debug logs are saved to your device's Documents folder:
- **iOS**: Documents/match_detail_debug.log
- **Android**: Documents/match_detail_debug.log

## What the Logs Contain

The exported log file includes detailed information about:

1. **Player Data Structure**
   - All field names available in the player object
   - Player stats object structure and values
   - Full player data for the first player on your team

2. **Team Information**
   - Number of players on your team
   - Number of players on enemy team
   - First player's complete data structure

3. **Map Information**
   - Map ID from the match details
   - All available map names in the system
   - Whether the map lookup succeeded
   - Full map data if found

4. **Timestamps**
   - Each log entry has an ISO timestamp
   - Helps track the exact order of operations

## Steps to Share the Log

1. After exporting, the log file will be in your Documents folder
2. Share the `match_detail_debug.log` file with the developer
3. The developer can then see:
   - What fields actually exist in the API response
   - Why certain data isn't displaying (missing fields, wrong field names, etc.)
   - What the actual data structure looks like

## Example Log Output Structure

```
[2026-04-03T12:34:56.789Z] [DEBUG] ==== MATCH DETAIL DEBUG START ====

[2026-04-03T12:34:56.790Z] [DEBUG] Player Info found
Data: true

[2026-04-03T12:34:56.791Z] [DEBUG] Player Info keys
Data: ["subject", "teamId", "characterId", "stats", ...]

[2026-04-03T12:34:56.792Z] [DEBUG] Player Stats keys
Data: ["kills", "deaths", "assists", "score", ...]
```

## Troubleshooting

- If the button doesn't appear, make sure you've scrolled to the bottom
- If logs aren't created, check that you have file system permissions
- The alert will show you the exact path where logs were saved
