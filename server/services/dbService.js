import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LowSync, JSONFileSync } from 'lowdb';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbFile = join(__dirname, '../db/db.json');
const adapter = new JSONFileSync(dbFile);
const db = new LowSync(adapter);
db.read();
if (!db.data) db.data = {};

export function getDb() {
  db.read();
  return db.data;
}

export function saveDb(data) {
  db.data = data;
  db.write();
}
