# ADB Commands for Verifying SQLite Database

## Prerequisites
- Android device connected via USB
- USB Debugging enabled on device (Settings → Developer Options → USB Debugging)
- Device authorized (check device for authorization prompt)

## Step 1: Verify Device Connection
```bash
adb devices
```
Output should show your device as "device" (not "offline" or "unauthorized")

## Step 2: Open ADB Shell
```bash
adb shell
```
This opens an interactive shell on the device.

## Step 3: Check if Database Directory Exists
```bash
ls /data/data/com.taropsqlite/databases/
```
Should show `instantdb.db` if the app has created data.

## Step 4: Query SQLite Database
```bash
sqlite3 /data/data/com.taropsqlite/databases/instantdb.db "SELECT * FROM kv LIMIT 10;"
```

This shows the key-value pairs stored in the SQLite database. If you see data here, expo-sqlite is working.

## Step 5: Check All Tables
```bash
sqlite3 /data/data/com.taropsqlite/databases/instantdb.db ".tables"
```

## Step 6: Pull Database to Computer (Optional)
```bash
adb pull /data/data/com.taropsqlite/databases/instantdb.db ./instantdb.db
```

Then open `instantdb.db` with [DB Browser for SQLite](https://sqlitebrowser.org/) to inspect visually.

## Step 7: Verify Storage Adapter via Console Logs

You can also verify expo-sqlite is being used through Expo DevTools:

### In Terminal (while Metro is running)
```bash
npx expo start
```

Then press `d` to open JS Debugger

### In Chrome DevTools
1. Go to **Console** tab
2. Look for logs starting with `[Storage]`
3. You should see:
   - `[Storage] Initializing with database: instantdb`
   - `[Storage] Opening database: instantdb` (after first interaction)
   - `[Storage] Database initialized successfully`
   - `[Storage] getItem(...)` / `[Storage] setItem(...)` (as data is synced)

If you see these logs, expo-sqlite storage adapter is active and working.

### Steps to trigger storage operations:
1. Open the app
2. Wait for data to load on Data Viewer screen
3. Switch between different entity tabs (Bookings, Contributors, etc.)
4. Open JS Debugger again to see updated logs

## Troubleshooting

### Database not found
- Run the app for a few seconds to let it create data
- Check package name: `adb shell ls /data/data/ | grep taropsqlite`
- Make sure app is actively displaying data on screen before checking

### No [Storage] logs appearing
- Make sure you navigated to different entity tabs to trigger data sync
- Wait 10+ seconds for InstantDB to fetch data from server
- Refresh console and check again

### Permission denied
- Try: `adb shell run-as com.taropsqlite ls /data/data/com.taropsqlite/databases/`

### Exit shell
```bash
exit
```
