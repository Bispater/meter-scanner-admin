import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | ((row: T) => unknown);
  format?: (value: unknown, row: T) => string | number | null;
  /** Resaltar la columna (ancho extra y color si el writer lo soporta). */
  highlight?: boolean;
  /**
   * Formato Excel para celdas de la columna. Usar `'@'` para forzar texto
   * y conservar los ceros a la izquierda (p. ej. `00027,9254`).
   */
  numFmt?: string;
}

export type ExportFormat = 'csv' | 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExportService {
  export<T>(
    rows: T[],
    columns: ExportColumn<T>[],
    fileName: string,
    format: ExportFormat = 'xlsx',
    sheetName = 'Datos',
  ): void {
    const data = this.toAoa(rows, columns);
    if (format === 'csv') {
      this.downloadCsv(data, fileName);
    } else {
      this.downloadXlsx(data, fileName, sheetName, columns);
    }
  }

  private toAoa<T>(rows: T[], columns: ExportColumn<T>[]): (string | number | null)[][] {
    const headers = columns.map(c => c.header);
    const body = rows.map(row =>
      columns.map(col => {
        const raw = typeof col.key === 'function' ? col.key(row) : (row as any)[col.key];
        const value = col.format ? col.format(raw, row) : raw;
        if (value === null || value === undefined) return '';
        if (typeof value === 'number' || typeof value === 'string') return value;
        if (value instanceof Date) return value.toISOString();
        return String(value);
      }),
    );
    return [headers, ...body];
  }

  private downloadXlsx<T>(
    aoa: (string | number | null)[][],
    fileName: string,
    sheetName: string,
    columns?: ExportColumn<T>[],
  ): void {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = aoa[0].map((_, idx) => {
      const col = columns?.[idx];
      const max = aoa.reduce((acc, row) => {
        const v = row[idx];
        const len = v == null ? 0 : String(v).length;
        return Math.max(acc, len);
      }, 0);
      const base = Math.min(Math.max(max + 2, 10), 60);
      return { wch: col?.highlight ? Math.max(base, 16) : base };
    });

    if (columns && columns.length) {
      const headerFill = { patternType: 'solid', fgColor: { rgb: 'FF06B6D4' } };
      const headerFont = { bold: true, color: { rgb: 'FFFFFFFF' } };
      const cellFill = { patternType: 'solid', fgColor: { rgb: 'FFE0F7FA' } };

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        for (let r = 0; r < aoa.length; r++) {
          const ref = XLSX.utils.encode_cell({ c, r });
          const cell = ws[ref];
          if (!cell) continue;
          if (col.highlight) {
            cell.t = 's';
            cell.v = cell.v == null ? '' : String(cell.v);
            cell.s = r === 0
              ? { fill: headerFill, font: headerFont, alignment: { horizontal: 'center' } }
              : { fill: cellFill, font: { bold: true } };
          } else if (r === 0) {
            cell.s = { font: { bold: true } };
          }
          if (col.numFmt && r > 0) {
            cell.z = col.numFmt;
            if (col.numFmt === '@') {
              cell.t = 's';
              cell.v = cell.v == null ? '' : String(cell.v);
            }
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    XLSX.writeFile(wb, this.withExtension(fileName, 'xlsx'), { cellStyles: true } as XLSX.WritingOptions);
  }

  private downloadCsv(aoa: (string | number | null)[][], fileName: string): void {
    const escape = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = aoa.map(row => row.map(escape).join(';')).join('\r\n');
    const bom = '﻿';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.withExtension(fileName, 'csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private withExtension(name: string, ext: string): string {
    const lower = name.toLowerCase();
    return lower.endsWith(`.${ext}`) ? name : `${name}.${ext}`;
  }

  buildFileName(prefix: string): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${prefix}_${y}${m}${day}_${hh}${mm}`;
  }
}
