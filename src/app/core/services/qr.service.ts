import { Injectable, signal } from '@angular/core';
import QRCode from 'qrcode';

export interface QrCode {
  id: string;
  meterId: string;
  tower: string;
  apartment: string;
  generated: string;
  dataUrl: string;        // base64 PNG data-URL of the QR image
  payload: string;        // raw JSON string encoded in the QR
}

@Injectable({ providedIn: 'root' })
export class QrService {
  private readonly _qrList = signal<QrCode[]>([]);
  readonly qrList = this._qrList.asReadonly();
  private _initialized = false;

  readonly towers = ['Torre A', 'Torre B', 'Torre C'];

  /** Bootstrap seed data the first time any component reads the list */
  async init(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    const seed = [
      { id: 'qr-001', meterId: '621659-11', tower: 'Torre A', apartment: '101', generated: '20/03/2026' },
      { id: 'qr-002', meterId: '24081375',  tower: 'Torre B', apartment: '504', generated: '20/03/2026' },
      { id: 'qr-003', meterId: '785412-03', tower: 'Torre A', apartment: '203', generated: '21/03/2026' },
      { id: 'qr-004', meterId: '963258-07', tower: 'Torre C', apartment: '302', generated: '22/03/2026' },
      { id: 'qr-005', meterId: '147852-19', tower: 'Torre B', apartment: '201', generated: '23/03/2026' },
      { id: 'qr-006', meterId: '369258-22', tower: 'Torre A', apartment: '405', generated: '24/03/2026' },
    ];

    const list: QrCode[] = [];
    for (const s of seed) {
      const payload = this._buildPayload(s.meterId, s.tower, s.apartment);
      const dataUrl = await this._toDataUrl(payload);
      list.push({ ...s, payload, dataUrl });
    }
    this._qrList.set(list);
  }

  async addQr(tower: string, apartment: string, meterId?: string): Promise<QrCode> {
    meterId = meterId || this._generateMeterId();
    const now = new Date();
    const generated = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const payload = this._buildPayload(meterId, tower, apartment);
    const dataUrl = await this._toDataUrl(payload);

    const newQr: QrCode = {
      id: `qr-${Date.now()}`,
      meterId,
      tower,
      apartment,
      generated,
      dataUrl,
      payload,
    };
    this._qrList.update(list => [newQr, ...list]);
    return newQr;
  }

  getByMeterId(meterId: string): QrCode | undefined {
    return this._qrList().find(q => q.meterId === meterId);
  }

  /** JSON payload the Flutter app expects */
  private _buildPayload(meterId: string, tower: string, apartment: string): string {
    return JSON.stringify({
      meter_id: meterId,
      apartment_info: `${tower} — Depto ${apartment}`,
    });
  }

  private async _toDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  }

  private _generateMeterId(): string {
    const num = Math.floor(100000 + Math.random() * 900000);
    const suffix = String(Math.floor(10 + Math.random() * 90));
    return `${num}-${suffix}`;
  }
}
