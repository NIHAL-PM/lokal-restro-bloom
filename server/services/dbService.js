import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbFile = join(__dirname, '../db/db.json');

// Default data structure
const defaultData = {
  users: [],
  orders: [],
  menu: [],
  tables: [],
  rooms: [],
  settings: {},
  reports: [],
  admin: null
};

const adapter = new JSONFile(dbFile);
const db = new Low(adapter, defaultData);

// Initialize database
await db.read();

export async function getDb() {
  await db.read();
  return db.data;
}

export async function saveDb(data) {
  db.data = data;
  await db.write();
}
