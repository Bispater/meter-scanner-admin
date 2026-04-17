import { Injectable } from '@angular/core';
import type { QrCode } from '../models/qr-code.model';

const DB = 'metscan-qr-cache';
const STORE = 'images';
const FULL_STORE = 'fullQrs';
const VERSION = 2;

interface Row {
  key: string;
  dataUrl: string;
}

/**
 * Persists PNG data URLs (by payload hash) and full QrCode rows so a page reload
 * can restore thumbnails without re-running the whole sync loop.
 */
@Injectable({ providedIn: 'root' })
export class QrImageCacheService {
  private dbp: Promise<IDBDatabase | null> | null = null;

  private open(): Promise<IDBDatabase | null> {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    if (!this.dbp) {
      this.dbp = new Promise(resolve => {
        const req = indexedDB.open(DB, VERSION);
        req.onerror = () => resolve(null);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains(FULL_STORE)) {
            db.createObjectStore(FULL_STORE, { keyPath: 'qrCode' });
          }
        };
      });
    }
    return this.dbp;
  }

  async get(key: string): Promise<string | null> {
    const db = await this.open();
    if (!db) return null;
    return new Promise(resolve => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Row | undefined)?.dataUrl ?? null);
      req.onerror = () => resolve(null);
    });
  }

  async set(key: string, dataUrl: string): Promise<void> {
    const db = await this.open();
    if (!db) return;
    return new Promise(resolve => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ key, dataUrl } as Row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async getFullQr(qrCode: string): Promise<QrCode | null> {
    const db = await this.open();
    if (!db?.objectStoreNames.contains(FULL_STORE)) return null;
    return new Promise(resolve => {
      const tx = db.transaction(FULL_STORE, 'readonly');
      const req = tx.objectStore(FULL_STORE).get(qrCode);
      req.onsuccess = () => resolve((req.result as QrCode | undefined) ?? null);
      req.onerror = () => resolve(null);
    });
  }

  async saveFullQr(qr: QrCode): Promise<void> {
    const db = await this.open();
    if (!db?.objectStoreNames.contains(FULL_STORE)) return;
    return new Promise(resolve => {
      const tx = db.transaction(FULL_STORE, 'readwrite');
      tx.objectStore(FULL_STORE).put(qr);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }

  async loadAllFullQrs(): Promise<QrCode[]> {
    const db = await this.open();
    if (!db?.objectStoreNames.contains(FULL_STORE)) return [];
    return new Promise(resolve => {
      const tx = db.transaction(FULL_STORE, 'readonly');
      const req = tx.objectStore(FULL_STORE).getAll();
      req.onsuccess = () => resolve((req.result as QrCode[]) ?? []);
      req.onerror = () => resolve([]);
    });
  }

  async deleteFullQr(qrCode: string): Promise<void> {
    const db = await this.open();
    if (!db?.objectStoreNames.contains(FULL_STORE)) return;
    return new Promise(resolve => {
      const tx = db.transaction(FULL_STORE, 'readwrite');
      tx.objectStore(FULL_STORE).delete(qrCode);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}
