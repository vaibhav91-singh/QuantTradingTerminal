import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'data.json');

const DEFAULT_DATA = {
  wallet: {
    startingBalance: 10000.00,
    balance: 10000.00,
  },
  activeTrade: null,
  tradeHistory: [],
  settings: {
    twelveDataKey: '',
  },
  lastUpdated: Date.now()
};

/**
 * Persistent Database Manager with Atomic File Operations
 */
class DatabaseManager {
  constructor() {
    this.dbPath = DB_PATH;
    this.ensureInitialized();
  }

  ensureInitialized() {
    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      if (!fs.existsSync(this.dbPath)) {
        this.write(DEFAULT_DATA);
      } else {
        // Validate JSON file integrity
        try {
          const raw = fs.readFileSync(this.dbPath, 'utf8');
          JSON.parse(raw);
        } catch (corruptErr) {
          console.warn('Database JSON corrupted, creating backup and resetting default data:', corruptErr.message);
          const backupPath = path.join(dbDir, `data_corrupt_${Date.now()}.json`);
          fs.renameSync(this.dbPath, backupPath);
          this.write(DEFAULT_DATA);
        }
      }
    } catch (err) {
      console.error('Failed to initialize database storage:', err);
    }
  }

  read() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        this.write(DEFAULT_DATA);
        return DEFAULT_DATA;
      }
      const raw = fs.readFileSync(this.dbPath, 'utf8');
      const data = JSON.parse(raw);
      return { ...DEFAULT_DATA, ...data };
    } catch (err) {
      console.error('Error reading database file, returning default data:', err);
      return DEFAULT_DATA;
    }
  }

  write(data) {
    try {
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const tempPath = `${this.dbPath}.tmp_${Date.now()}`;
      const payload = JSON.stringify({ ...data, lastUpdated: Date.now() }, null, 2);
      
      fs.writeFileSync(tempPath, payload, 'utf8');
      fs.renameSync(tempPath, this.dbPath);
      return true;
    } catch (err) {
      console.error('Error performing atomic write to database:', err);
      return false;
    }
  }

  getWallet() {
    const db = this.read();
    return db.wallet || DEFAULT_DATA.wallet;
  }

  saveWallet(walletData) {
    const db = this.read();
    db.wallet = { ...db.wallet, ...walletData };
    this.write(db);
    return db.wallet;
  }

  resetWallet() {
    const db = this.read();
    db.wallet = { startingBalance: 10000.00, balance: 10000.00 };
    db.activeTrade = null;
    db.tradeHistory = [];
    this.write(db);
    return db.wallet;
  }

  getActiveTrade() {
    const db = this.read();
    return db.activeTrade || null;
  }

  setActiveTrade(trade) {
    const db = this.read();
    db.activeTrade = trade;
    this.write(db);
    return db.activeTrade;
  }

  getTradeHistory() {
    const db = this.read();
    return db.tradeHistory || [];
  }

  addTrade(trade) {
    const db = this.read();
    if (!Array.isArray(db.tradeHistory)) db.tradeHistory = [];
    
    // Deduplicate by trade id if exists
    db.tradeHistory = db.tradeHistory.filter(t => t.id !== trade.id);
    db.tradeHistory.push(trade);
    this.write(db);
    return db.tradeHistory;
  }

  clearTradeHistory() {
    const db = this.read();
    db.tradeHistory = [];
    this.write(db);
    return [];
  }

  getSettings() {
    const db = this.read();
    return db.settings || DEFAULT_DATA.settings;
  }

  saveSettings(newSettings) {
    const db = this.read();
    db.settings = { ...db.settings, ...newSettings };
    this.write(db);
    return db.settings;
  }
}

export const db = new DatabaseManager();
