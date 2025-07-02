// IndexedDB wrapper using idb
import { openDB, DBSchema } from 'idb';


interface RestroDB extends DBSchema {
  menu: { key: string; value: any };
  rooms: { key: string; value: any };
  tables: { key: string; value: any };
  orders: { key: string; value: any };
  settings: { key: string; value: any };
  transactions: { key: string; value: any };
}

export const dbPromise = openDB<RestroDB>('lokal-restro', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('menu', { keyPath: 'id' });
      db.createObjectStore('rooms', { keyPath: 'id' });
      db.createObjectStore('tables', { keyPath: 'id' });
      db.createObjectStore('orders', { keyPath: 'id' });
      db.createObjectStore('settings');
    }
    if (oldVersion < 2) {
      db.createObjectStore('transactions', { keyPath: 'id' });
    }
  },
});


export async function putItem(store: keyof RestroDB, value: any) {
  const db = await dbPromise;
  return db.put(store as any, value);
}

export async function getAll(store: keyof RestroDB) {
  const db = await dbPromise;
  return db.getAll(store as any);
}

export async function deleteItem(store: keyof RestroDB, key: string) {
  const db = await dbPromise;
  return db.delete(store as any, key);
}
