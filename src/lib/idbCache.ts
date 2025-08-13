const DB_NAME = 'pc-gis-cache';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

type CacheRecord = { value: unknown; expiresAt: number };

type IDBDatabaseT = IDBDatabase;
function openDb(): Promise<IDBDatabaseT> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        const rec = getReq.result as CacheRecord | undefined;
        if (!rec) return resolve(null);
        if (typeof rec.expiresAt === 'number' && Date.now() > rec.expiresAt) {
          resolve(null);
        } else {
          resolve(rec.value as T);
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(`idb:${key}`);
      if (!raw) return null;
      const rec = JSON.parse(raw) as CacheRecord;
      if (Date.now() > rec.expiresAt) return null;
      return rec.value as T;
    } catch {
      return null;
    }
  }
}

export async function idbSet<T>(key: string, value: T, ttlMs: number): Promise<void> {
  const record: CacheRecord = { value, expiresAt: Date.now() + ttlMs };
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putReq = store.put(record, key);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(`idb:${key}`, JSON.stringify(record));
    } catch {
      // ignore
    }
  }
}