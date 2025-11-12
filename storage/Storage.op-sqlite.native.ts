import { open } from '@op-engineering/op-sqlite';

export default class Storage {
  constructor(dbName) {
    this.dbName = dbName;
    this._db = null;
    this._initialized = false;
    console.log(`[Storage] Initializing with database: ${dbName}`);
    this._initialize();
  }

  _initialize() {
    try {
      console.log(`[Storage] Opening database: ${this.dbName}`);
      this._db = open({ name: this.dbName });
      console.log(`[Storage] Database opened, creating table`);
      this._db.executeSync(
        'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)'
      );
      this._initialized = true;
      console.log(`[Storage] Database initialized successfully`);
    } catch (error) {
      console.error(`[Storage] Initialization error:`, error);
      throw error;
    }
  }

  async getItem(k) {
    if (!this._initialized) {
      console.log(`[Storage] getItem waiting for initialization...`);
      throw new Error('Storage not initialized');
    }
    console.log(`[Storage] getItem called for key: ${k}`);
    try {
      const result = this._db.executeSync(
        'SELECT value FROM kv WHERE key = ?',
        [k]
      );
      const value = result && result.length > 0 ? result[0].value : null;
      console.log(`[Storage] getItem(${k}):`, value ? 'found ✓' : 'not found');
      return value;
    } catch (error) {
      console.error(`[Storage] getItem error:`, error);
      return null;
    }
  }

  async setItem(k, v) {
    if (!this._initialized) {
      console.log(`[Storage] setItem waiting for initialization...`);
      throw new Error('Storage not initialized');
    }
    console.log(`[Storage] setItem(${k}):`, v.substring(0, 50) + '...');
    try {
      this._db.executeSync(
        'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
        [k, v]
      );
      console.log(`[Storage] setItem(${k}): success`);
    } catch (error) {
      console.error(`[Storage] setItem error:`, error);
      throw error;
    }
  }
}
