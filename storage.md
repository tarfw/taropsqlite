# Storage Configuration for React Native

InstantDB for React Native supports multiple storage backends. By default, it uses AsyncStorage, but you can configure it to use SQLite (Expo) or MMKV

## Installation

### For AsyncStorage (Default)
```bash
npm install @react-native-async-storage/async-storage
```

No additional configuration needed - this is the default.

### For MMKV

1. Install dependencies:
```bash
npm install react-native-mmkv react-native-nitro-modules
```

2. Save MMKV native storage file into storage/Storage.mmkv.native:
```typescript
import { createMMKV } from 'react-native-mmkv';

export default class Storage {
  constructor(dbName) {
    this.storage = createMMKV({
      id: dbName
    });
  }

  async getItem(k) {
    const value = this.storage.getString(k);
    return value === undefined ? null : value;
  }

  async setItem(k, v) {
    this.storage.set(k, v);
  }
}
```

3. Configure Metro in your `metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add storage resolver
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect Storage.native to Storage.mmkv.native
  if (moduleName.endsWith('Storage.native')) {
    const mmkvPath = moduleName.replace('Storage.native', 'storage/Storage.mmkv.native');
    return context.resolveRequest(context, mmkvPath, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

### For SQLite (Expo)

1. Install dependency:
```bash
npm install expo-sqlite
```

2. Save Expo native storage file into storage/Storage.expo.native:
```typescript
import { openDatabaseAsync } from 'expo-sqlite';

export default class Storage {
  constructor(dbName) {
    this.dbName = dbName;
    this._db = null;
    this._initPromise = null;
  }

  async _ensureInitialized() {
    if (!this._initPromise) {
      this._initPromise = this._initialize();
    }
    return this._initPromise;
  }

  async _initialize() {
    this._db = await openDatabaseAsync(this.dbName);
    await this._db.execAsync(
      'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)'
    );
  }

  async getItem(k) {
    await this._ensureInitialized();
    const result = await this._db.getFirstAsync(
      'SELECT value FROM kv WHERE key = ?',
      [k]
    );
    return result ? result.value : null;
  }

  async setItem(k, v) {
    await this._ensureInitialized();
    await this._db.runAsync(
      'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
      [k, v]
    );
  }
}
```

3. Configure Metro in your `metro.config.js`:
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add storage resolver
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect Storage.native to Storage.expo.native
  if (moduleName.endsWith('Storage.native')) {
    const sqlitePath = moduleName.replace('Storage.native', 'storage/Storage.expo.native');
    return context.resolveRequest(context, sqlitePath, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

## Usage

Once configured, just use InstantDB normally:

```javascript
import { init } from '@instantdb/react-native';

const db = init({
  appId: 'your-app-id'
});
```

## Notes

1. **Restart Required**: You must restart Metro after changing the configuration
2. **Build Time**: This is a build-time configuration, not runtime
3. **One Storage Type**: You can only use one storage type per app build

## Troubleshooting

### Module not found errors
Make sure you've installed the required peer dependencies for your chosen storage type.

### Metro not picking up changes
1. Clear Metro cache: `npx expo start --clear`
2. Clear build cache: `rm -rf node_modules/.cache`
3. Restart Metro
