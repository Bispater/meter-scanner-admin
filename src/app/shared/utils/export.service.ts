import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | ((row: T) => unknown);
  format?: (value: unknown, row: T) => string | number | null;
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
      this.downloadXlsx(data, fileName, sheetName);
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

  private downloadXlsx(aoa: (string | number | null)[][], fileName: string, sheetName: string): void {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = aoa[0].map((_, idx) => {
      const max = aoa.reduce((acc, row) => {
        const v = row[idx];
        const len = v == null ? 0 : String(v).length;
        return Math.max(acc, len);
      }, 0);
      return { wch: Math.min(Math.max(max + 2, 10), 60) };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    XLSX.writeFile(wb, this.withExtension(fileName, 'xlsx'));
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
