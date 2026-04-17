import { Injectable, signal } from '@angular/core';
import QRCode from 'qrcode';

export type QrMeterType = 'A' | 'B';

export interface QrCode {
  id: string;
  qrCode: string;         // stable identifier: building-tower-apt (e.g. "Robles-A-1409")
  meterId: string;        // physical meter ID (informational, can change)
  meterType: QrMeterType;
  building: string;
  tower: string;
  apartment: string;
  apartmentId?: number;
  generated: string;
  dataUrl: string;        // base64 PNG data-URL of the QR image
  payload: string;        // raw string encoded in the QR (= JSON)
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
      { building: 'Edificio Demo', tower: 'Torre A', apartment: '101', meterId: '621659-11', meterType: 'A' as QrMeterType, generated: '20/03/2026' },
      { building: 'Edificio Demo', tower: 'Torre B', apartment: '504', meterId: '24081375',  meterType: 'A' as QrMeterType, generated: '20/03/2026' },
      { building: 'Edificio Demo', tower: 'Torre A', apartment: '203', meterId: '785412-03', meterType: 'B' as QrMeterType, generated: '21/03/2026' },
      { building: 'Edificio Demo', tower: 'Torre C', apartment: '302', meterId: '963258-07', meterType: 'A' as QrMeterType, generated: '22/03/2026' },
      { building: 'Edificio Demo', tower: 'Torre B', apartment: '201', meterId: '147852-19', meterType: 'A' as QrMeterType, generated: '23/03/2026' },
      { building: 'Edificio Demo', tower: 'Torre A', apartment: '405', meterId: '369258-22', meterType: 'A' as QrMeterType, generated: '24/03/2026' },
    ];

    const list: QrCode[] = [];
    for (const s of seed) {
      const qrCode = this._buildQrCode(s.building, s.tower, s.apartment);
      const payload = this._buildPayload(qrCode, s.building, s.tower, s.apartment, s.meterId, s.meterType);
      const dataUrl = await this._toDataUrl(payload);
      list.push({
        id: `qr-${s.apartment}${this._towerShort(s.tower)}`,
        qrCode,
        meterId: s.meterId,
        meterType: s.meterType,
        building: s.building,
        tower: s.tower,
        apartment: s.apartment,
        generated: s.generated,
        dataUrl,
        payload,
      });
    }
    this._qrList.set(list);
  }

  async addQr(
    building: string,
    tower: string,
    apartment: string,
    meterId: string,
    meterType: QrMeterType = 'A',
    apartmentId?: number,
  ): Promise<QrCode> {
    const qrCode = this._buildQrCode(building, tower, apartment);
    const now = new Date();
    const generated = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const payload = this._buildPayload(qrCode, building, tower, apartment, meterId, meterType, apartmentId);
    const dataUrl = await this._toDataUrl(payload);

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
    this._qrList.update(list => [newQr, ...list]);
    return newQr;
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

  /** Derive the stable qr_code from building + tower + apartment */
  private _buildQrCode(building: string, tower: string, apartment: string): string {
    const bShort = building.replace(/^[Ee]dificio\s+/, '').trim().substring(0, 8);
    return `${bShort}-${this._towerShort(tower)}-${apartment}`;
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
