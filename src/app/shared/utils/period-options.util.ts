import { MeasurementCycle } from '../../core/models/cycle.model';

/** Nombres de mes en español, índice 0 = enero. */
export const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

/** Opción del selector «Período»: un mes calendario concreto. */
export interface PeriodOption {
  /** Clave estable `YYYY-MM` (ordenable como string). */
  value: string;
  year: number;
  month: number;
  /** Etiqueta legible, p. ej. «Septiembre 2026». */
  label: string;
}

/** `2026-09` a partir de año y mes (1-12). */
export function periodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Inverso de `periodKey`. Devuelve null si la clave no es un mes válido. */
export function parsePeriodKey(key: string | null | undefined): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(key ?? '');
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/** «Septiembre 2026». */
export function periodLabel(year: number, month: number): string {
  return `${SPANISH_MONTHS[month - 1] ?? `mes ${month}`} ${year}`;
}

/**
 * Lista de meses para el selector «Período»: los últimos `monthsBack` meses
 * (incluido el actual) más cualquier mes que tenga un ciclo registrado, así los
 * períodos antiguos con ciclos siguen siendo alcanzables. Ordenado del más
 * reciente al más antiguo.
 */
export function buildPeriodOptions(
  cycles: readonly MeasurementCycle[],
  monthsBack = 24,
  now: Date = new Date(),
): PeriodOption[] {
  const map = new Map<string, PeriodOption>();
  const add = (year: number, month: number): void => {
    const value = periodKey(year, month);
    if (!map.has(value)) map.set(value, { value, year, month, label: periodLabel(year, month) });
  };
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    add(d.getFullYear(), d.getMonth() + 1);
  }
  for (const c of cycles) {
    if (c.year && c.month >= 1 && c.month <= 12) add(c.year, c.month);
  }
  return [...map.values()].sort((a, b) => b.value.localeCompare(a.value));
}
