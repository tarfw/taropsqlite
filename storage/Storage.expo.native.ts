import { openDatabaseAsync } from 'expo-sqlite';

export default class Storage {
  constructor(dbName) {
    this.dbName = dbName;
    this._db = null;
    this._initPromise = null;
    console.log(`[Storage] Initializing with database: ${dbName}`);
  }

  async _ensureInitialized() {
    if (!this._initPromise) {
      this._initPromise = this._initialize();
    }
    return this._initPromise;
  }

  async _initialize() {
    console.log(`[Storage] Opening database: ${this.dbName}`);
    this._db = await openDatabaseAsync(this.dbName);
    await this._db.execAsync(
      'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)'
    );
    console.log(`[Storage] Database initialized successfully`);
  }

  async getItem(k) {
    await this._ensureInitialized();
    const result = await this._db.getFirstAsync(
      'SELECT value FROM kv WHERE key = ?',
      [k]
    );
    console.log(`[Storage] getItem(${k}):`, result?.value ? 'found' : 'not found');
    return result ? result.value : null;
  }

  async setItem(k, v) {
    await this._ensureInitialized();
    console.log(`[Storage] setItem(${k}):`, v.substring(0, 50) + '...');
    await this._db.runAsync(
      'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
      [k, v]
    );
  }
}
