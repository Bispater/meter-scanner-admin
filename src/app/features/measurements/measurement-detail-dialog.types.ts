import { Measurement } from '../../core/models/measurement.model';

/** Datos del modal de detalle; compatible con pasar solo `Measurement` (legacy). */
export interface MeasurementDetailDialogData {
  measurement: Measurement;
  /** Solo mediciones pendientes, en el orden en que se revisarán (álbum). */
  reviewQueue?: Measurement[];
}

export function normalizeMeasurementDetailDialogData(
  data: Measurement | MeasurementDetailDialogData,
): MeasurementDetailDialogData {
  if (data && typeof data === 'object' && 'measurement' in data) {
    return data as MeasurementDetailDialogData;
  }
  return { measurement: data as Measurement };
}
