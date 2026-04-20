/**
 * Formato visual del medidor según cara A (5+4) o B (8+1 esfera).
 * Las lecturas B antiguas guardadas como 12 dígitos (8+4) se muestran como 8 enteros + último dígito (esfera).
 */
export function formatMeterReadingDisplay(
  raw: number | string | null | undefined,
  layout?: 'A' | 'B',
): string {
  if (raw == null || raw === '') return '—';

  let d = String(raw).trim();
  if (d.includes('.')) {
    d = d.split('.')[0];
  }
  d = d.replace(/\D/g, '');
  if (!d) return '—';

  const isB = layout === 'B';
  const fracLen = isB ? 1 : 4;
  const intLen = isB ? 8 : 5;

  /** Tipo B legacy: modelo anterior 8 enteros + 4 decimales en una cadena de 12 dígitos → mostrar 8 + esfera (último dígito). */
  if (isB && d.length >= 12) {
    return `${d.slice(0, 8)},${d.slice(-1)}`;
  }

  const right = d.slice(-fracLen).padStart(fracLen, '0');
  const leftRaw = d.slice(0, Math.max(0, d.length - fracLen));
  const left = leftRaw.padStart(intLen, '0');

  return `${left},${right}`;
}
