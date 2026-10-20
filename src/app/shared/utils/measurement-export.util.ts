import { Measurement } from '../../core/models/measurement.model';
import { ExportColumn } from './export.service';
import { formatMeterReadingDisplay } from './meter-reading-format';

/** 'Torre A' → 'A' (en mayúsculas) para ordenar/etiquetar. */
function cleanTower(t: string | undefined): string {
  return String(t ?? '').replace(/^\s*torre\s+/i, '').trim().toUpperCase();
}

/** Clave numérica del depto («1409» → 1409); no numéricos van al final. */
function apartmentSortKey(a: string | undefined): number {
  const digits = String(a ?? '').replace(/\D/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

/**
 * Orden de la planilla que usa la clienta: torre (A → B → …) y dentro de cada
 * torre el depto ascendente. No muta el arreglo recibido.
 */
export function sortMeasurementsForSheet(rows: readonly Measurement[]): Measurement[] {
  return [...rows].sort((a, b) => {
    const tA = cleanTower(a.tower);
    const tB = cleanTower(b.tower);
    if (tA !== tB) return tA.localeCompare(tB);
    const apA = apartmentSortKey(a.apartment);
    const apB = apartmentSortKey(b.apartment);
    if (apA !== apB) return apA - apB;
    return String(a.apartment ?? '').localeCompare(String(b.apartment ?? ''));
  });
}

/**
 * Columnas de la planilla de lecturas: «Depto» (número-torre, p. ej. `1409-A`)
 * y «Lectura» con el formato de display (conserva ceros a la izquierda).
 * Ambas se fuerzan a texto en Excel para que no se pierdan los ceros.
 */
export function measurementSheetColumns(): ExportColumn<Measurement>[] {
  return [
    {
      header: 'Depto',
      key: row => {
        const towerLetter = String(row.tower ?? '').replace(/^\s*torre\s+/i, '').trim();
        return towerLetter ? `${row.apartment}-${towerLetter}` : String(row.apartment ?? '');
      },
      highlight: true,
      numFmt: '@',
    },
    {
      header: 'Lectura',
      key: 'reading_value',
      format: (_v, row) =>
        row.reading_value == null ? '' : formatMeterReadingDisplay(row.reading_value, row.reading_layout),
      highlight: true,
      numFmt: '@',
    },
  ];
}

/** «Lord Cochrane · Septiembre 2026» → `lord_cochrane_septiembre_2026` (apto para nombre de archivo). */
export function slugForFileName(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}
