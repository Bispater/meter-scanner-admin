/**
 * Formato visual del medidor: caras A y B comparten 5 enteros + 4 decimales (coma lógica).
 * (Antes B se mostraba 8+1; los valores antiguos con escala errónea no siempre se pueden corregir sin re-lectura.)
 */
const INT_LEN = 5;
const FRAC_LEN = 4;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '');
}

/**
 * `reading_value` en API es Decimal m³ (p. ej. 0.0647) — hay que respetar la parte fraccionaria;
 * nunca se puede tomar solo `split('.')[0]` o "00000,0000" para lecturas reales.
 */
function formatFromDecimalM3String(s: string): string | null {
  const t = s.trim();
  if (!t.includes('.')) return null;
  const parts = t.split('.');
  if (parts.length !== 2) return null;
  let intPart = digitsOnly(parts[0] ?? '') || '0';
  let fracPart = digitsOnly(parts[1] ?? '') || '';
  if (intPart.length > INT_LEN) {
    intPart = intPart.slice(-INT_LEN);
  } else {
    intPart = intPart.padStart(INT_LEN, '0');
  }
  if (fracPart.length > FRAC_LEN) {
    fracPart = fracPart.slice(0, FRAC_LEN);
  } else {
    fracPart = fracPart.padEnd(FRAC_LEN, '0');
  }
  return `${intPart},${fracPart}`;
}

export function formatMeterReadingDisplay(
  raw: number | string | null | undefined,
  layout?: 'A' | 'B',
): string {
  if (raw == null || raw === '') return '—';

  let asString: string;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    // Evitar basura de coma flotante al serializar
    asString = (Math.round(raw * 10000) / 10000).toFixed(4);
  } else {
    asString = String(raw).trim();
  }

  if (asString.includes('.')) {
    const fromDec = formatFromDecimalM3String(asString);
    if (fromDec != null) {
      return fromDec;
    }
  }

  let d = digitsOnly(asString);
  if (!d) return '—';

  if (layout === 'B' && d.length > 9) {
    d = d.slice(-9);
  }

  const right = d.slice(-FRAC_LEN).padStart(FRAC_LEN, '0');
  const leftRaw = d.slice(0, Math.max(0, d.length - FRAC_LEN));
  const left = leftRaw.padStart(INT_LEN, '0');

  return `${left},${right}`;
}

/** Valor m³ para hojas de cálculo: punto decimal y 4 cifras (sin perder `.0000`). */
export function formatMeterReadingNumericIso(
  raw: number | string | null | undefined,
): string {
  if (raw == null || raw === '') return '';
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return (Math.round(raw * 10000) / 10000).toFixed(4);
  }
  const t = String(raw).trim().replace(',', '.');
  const n = parseFloat(t);
  if (!Number.isFinite(n)) return '';
  return (Math.round(n * 10000) / 10000).toFixed(4);
}
