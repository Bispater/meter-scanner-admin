import { Injectable, inject, signal } from '@angular/core';
import QRCode from 'qrcode';
import { Apartment, Building, Tower } from '../models/building.model';
import { QrMeterType, QrCode } from '../models/qr-code.model';
import { QrImageCacheService } from './qr-image-cache.service';

export type { QrMeterType, QrCode };

const CHUNK_EVERY = 5;

@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly _cache = inject(QrImageCacheService);
  private readonly _qrList = signal<QrCode[]>([]);
  readonly qrList = this._qrList.asReadonly();
  private _initialized = false;
  private _initPromise: Promise<void> | null = null;

  readonly towers = ['Torre A', 'Torre B', 'Torre C'];

  /** Must match Django `Apartment._generate_qr_code` (number + tower short). */
  qrCodeForApartment(towerName: string, apartmentNumber: string): string {
    const short = towerName.replace(/^Torre\s+/i, '').trim();
    return `${apartmentNumber}${short}`;
  }

  /**
   * Restores cached QRs from IndexedDB before sync so a full page reload does not
   * walk every apartment again (only missing or stale rows are processed).
   */
  async init(): Promise<void> {
    if (this._initialized) return;
    if (!this._initPromise) {
      this._initPromise = (async () => {
        const restored = await this._cache.loadAllFullQrs();
        if (restored.length) {
          this._qrList.set(restored);
        }
        this._initialized = true;
      })();
    }
    await this._initPromise;
  }

  async addQr(
    building: string,
    tower: string,
    apartment: string,
    meterId: string,
    meterType: QrMeterType = 'A',
    apartmentId?: number,
    /** Prefer API value so JSON matches DB (scanned by the mobile app). */
    qrCodeFromApi?: string | null,
  ): Promise<QrCode> {
    const qrCode = (qrCodeFromApi?.trim() || this.qrCodeForApartment(tower, apartment)).trim();
    const now = new Date();
    const generated = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const payload = this._buildPayload(qrCode, building, tower, apartment, meterId, meterType, apartmentId);

    const inMemory = this._qrList().find(q => q.qrCode === qrCode);
    if (
      inMemory &&
      !this._needsQrRefreshFromParts(inMemory, building, tower, apartment, meterId, meterType, apartmentId)
    ) {
      return inMemory;
    }
    if (!inMemory) {
      const cachedFull = await this._cache.getFullQr(qrCode);
      if (
        cachedFull &&
        !this._needsQrRefreshFromParts(cachedFull, building, tower, apartment, meterId, meterType, apartmentId)
      ) {
        this._qrList.update(list => {
          const rest = list.filter(q => q.qrCode !== qrCode);
          return [cachedFull, ...rest];
        });
        return cachedFull;
      }
    }

    const cacheKey = `${qrCode}::${this._hashPayload(payload)}`;
    let dataUrl = await this._cache.get(cacheKey);
    if (!dataUrl) {
      dataUrl = await this._toDataUrl(payload);
      void this._cache.set(cacheKey, dataUrl);
    }

    const newQr: QrCode = {
      id: `qr-${Date.now()}`,
      qrCode,
      meterId,
      meterType,
      building,
      tower,
      apartment,
      generated,
      dataUrl,
      payload,
    };
    if (apartmentId != null) {
      newQr.apartmentId = apartmentId;
    }
    void this._cache.saveFullQr(newQr);
    this._qrList.update(list => {
      const rest = list.filter(q => q.qrCode !== newQr.qrCode);
      return [newQr, ...rest];
    });
    return newQr;
  }

  /**
   * Builds PNG data URLs in the browser (no API load). Yields between rows so the UI stays responsive.
   */
  async syncMissingFromBuildings(
    buildings: Building[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<void> {
    type Row = { b: Building; t: Building['towers'][0]; a: Building['towers'][0]['apartments'][0] };
    const rows: Row[] = [];
    for (const b of buildings) {
      for (const t of b.towers) {
        for (const a of t.apartments) {
          rows.push({ b, t, a });
        }
      }
    }
    const byCode = new Map(this._qrList().map(q => [q.qrCode, q]));
    const pending = rows.filter(({ b, t, a }) => {
      const code = (a.qrCode?.trim() || this.qrCodeForApartment(t.name, a.number)).trim();
      if (!code.length) return false;
      const q = byCode.get(code);
      if (!q) return true;
      return this._needsQrRefresh(q, b, t, a);
    });
    const total = pending.length;
    onProgress?.(0, total);
    let done = 0;
    for (let i = 0; i < pending.length; i++) {
      const { b, t, a } = pending[i];
      const code = (a.qrCode?.trim() || this.qrCodeForApartment(t.name, a.number)).trim();
      await this.addQr(b.name, t.name, a.number, a.meterId, a.readingLayout, +a.id, a.qrCode ?? null);
      done++;
      onProgress?.(done, total);
      if (i % CHUNK_EVERY === CHUNK_EVERY - 1 && i < pending.length - 1) {
        await new Promise<void>(r => requestAnimationFrame(() => r()));
      }
    }
  }

  getByQrCode(qrCode: string): QrCode | undefined {
    return this._qrList().find(q => q.qrCode === qrCode);
  }

  /** QR payload: JSON for Flutter (qr_code, meter_id, meter_type, apartment_id, apartment_info) */
  private _buildPayload(
    qrCode: string,
    building: string,
    tower: string,
    apartment: string,
    meterId: string,
    meterType: QrMeterType,
    apartmentId?: number,
  ): string {
    const o: {
      qr_code: string;
      meter_id: string;
      meter_type: string;
      building: string;
      apartment_info: string;
      apartment_id?: number;
    } = {
      qr_code: qrCode,
      meter_id: meterId || '',
      meter_type: meterType,
      building,
      apartment_info: `${building} — ${tower} — Depto ${apartment}`,
    };
    if (apartmentId != null) {
      o.apartment_id = apartmentId;
    }
    return JSON.stringify(o);
  }

  private async _toDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  }

  private _hashPayload(payload: string): string {
    let h = 2166136261;
    for (let i = 0; i < payload.length; i++) {
      h ^= payload.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  private _needsQrRefresh(q: QrCode, b: Building, t: Tower, a: Apartment): boolean {
    return (
      q.building !== b.name ||
      q.tower !== t.name ||
      q.apartment !== a.number ||
      (q.meterId ?? '') !== (a.meterId ?? '') ||
      q.meterType !== a.readingLayout
    );
  }

  private _needsQrRefreshFromParts(
    q: QrCode,
    building: string,
    tower: string,
    apartment: string,
    meterId: string,
    meterType: QrMeterType,
    apartmentId?: number,
  ): boolean {
    if (q.building !== building || q.tower !== tower || q.apartment !== apartment) return true;
    if ((q.meterId ?? '') !== (meterId ?? '')) return true;
    if (q.meterType !== meterType) return true;
    if ((q.apartmentId ?? null) !== (apartmentId ?? null)) return true;
    return false;
  }
}
