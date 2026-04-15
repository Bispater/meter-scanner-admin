import { Injectable, signal } from '@angular/core';
import QRCode from 'qrcode';

export interface QrCode {
  id: string;
  qrCode: string;         // stable identifier: aptNumber + towerShort (e.g. "1409A")
  meterId: string;        // physical meter ID (informational, can change)
  tower: string;
  apartment: string;
  generated: string;
  dataUrl: string;        // base64 PNG data-URL of the QR image
  payload: string;        // raw string encoded in the QR (= qrCode value)
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
      { tower: 'Torre A', apartment: '101', meterId: '621659-11', generated: '20/03/2026' },
      { tower: 'Torre B', apartment: '504', meterId: '24081375',  generated: '20/03/2026' },
      { tower: 'Torre A', apartment: '203', meterId: '785412-03', generated: '21/03/2026' },
      { tower: 'Torre C', apartment: '302', meterId: '963258-07', generated: '22/03/2026' },
      { tower: 'Torre B', apartment: '201', meterId: '147852-19', generated: '23/03/2026' },
      { tower: 'Torre A', apartment: '405', meterId: '369258-22', generated: '24/03/2026' },
    ];

    const list: QrCode[] = [];
    for (const s of seed) {
      const qrCode = this._buildQrCode(s.tower, s.apartment);
      const payload = this._buildPayload(qrCode, s.tower, s.apartment);
      const dataUrl = await this._toDataUrl(payload);
      list.push({ id: `qr-${s.apartment}${this._towerShort(s.tower)}`, qrCode, ...s, payload, dataUrl });
    }
    this._qrList.set(list);
  }

  async addQr(tower: string, apartment: string, meterId: string = ''): Promise<QrCode> {
    const qrCode = this._buildQrCode(tower, apartment);
    const now = new Date();
    const generated = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const payload = this._buildPayload(qrCode, tower, apartment);
    const dataUrl = await this._toDataUrl(payload);

    const newQr: QrCode = {
      id: `qr-${Date.now()}`,
      qrCode,
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

  getByQrCode(qrCode: string): QrCode | undefined {
    return this._qrList().find(q => q.qrCode === qrCode);
  }

  /** QR payload: JSON with qr_code + apartment_info for Flutter app */
  private _buildPayload(qrCode: string, tower: string, apartment: string): string {
    return JSON.stringify({
      qr_code: qrCode,
      apartment_info: `${tower} — Depto ${apartment}`,
    });
  }

  /** Derive the stable qr_code from tower name + apartment number */
  private _buildQrCode(tower: string, apartment: string): string {
    return `${apartment}${this._towerShort(tower)}`;
  }

  private _towerShort(tower: string): string {
    return tower.replace(/^[Tt]orre\s+/, '').trim();
  }

  private async _toDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  }
}
