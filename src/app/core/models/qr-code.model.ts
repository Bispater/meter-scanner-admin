export type QrMeterType = 'A' | 'B';

export interface QrCode {
  id: string;
  qrCode: string;
  meterId: string;
  meterType: QrMeterType;
  building: string;
  tower: string;
  apartment: string;
  apartmentId?: number;
  generated: string;
  dataUrl: string;
  payload: string;
}
