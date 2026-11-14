import { describe, expect, it } from 'vitest';

/** Mẫu: IndexedDB chạy được trong test nhờ fake-indexeddb (Dexie dùng ở M5). */
describe('fake-indexeddb', () => {
  it('ghi rồi đọc lại một bản ghi', async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('test-db', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('meta', { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put({ id: 'schemaVersion', value: 1 });
    await new Promise((resolve) => (tx.oncomplete = resolve));

    const value = await new Promise((resolve) => {
      const req = db.transaction('meta').objectStore('meta').get('schemaVersion');
      req.onsuccess = () => resolve(req.result);
    });
    expect(value).toEqual({ id: 'schemaVersion', value: 1 });
    db.close();
  });
});
