import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Measurement } from '../../core/models/measurement.model';

export interface PhotoZipResult {
  blob: Blob;
  included: number;
  skipped: number;
}

export interface PhotoZipHandle {
  /** Resuelve cuando el servidor responde con el ZIP, rechaza con `'cancelled'` si se aborta. */
  result: Promise<PhotoZipResult>;
  /** Aborta la petición HTTP en vuelo (unsubscribe) y rechaza la promesa. */
  cancel: () => void;
}

/** Símbolo único para identificar el rechazo por cancelación del usuario. */
export const ZIP_CANCELLED = 'cancelled';

/**
 * Exporta fotos de mediciones como ZIP. La construcción del ZIP se hace en el backend
 * (`POST /api/measurements/photos-zip/`) — una sola petición, sin CORS sobre /media/,
 * sin sobrecargar al servidor con cientos de fetches independientes desde el navegador.
 *
 * Formato del ZIP: `Edificio/Torre/Depto-NNN__YYYY-MM-DD_HHmmss.jpg`.
 */
@Injectable({ providedIn: 'root' })
export class MeasurementPhotoExportService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/measurements`;

  /** IDs numéricos a partir de las filas visibles que tienen foto. */
  collectIds(rows: Measurement[]): number[] {
    const ids: number[] = [];
    for (const r of rows) {
      if (!r.photo_url?.trim()) continue;
      const n = parseInt(String(r.id), 10);
      if (Number.isFinite(n)) ids.push(n);
    }
    return ids;
  }

  /**
   * Inicia la descarga del ZIP y devuelve un handle con `result` y `cancel`.
   * `cancel()` aborta la petición HTTP via Subscription.unsubscribe(); la promesa
   * se rechaza con la string `ZIP_CANCELLED` para que el caller distinga aborto
   * de error real.
   *
   * `periodLabel` se concatena al nombre de la carpeta raíz del ZIP
   * (ej. "Lord Cochrane 2026 Abril"); si no se envía, el backend intenta inferirlo
   * cuando todas las mediciones caen en el mismo mes.
   */
  buildZipFromIds(ids: number[], periodLabel?: string): PhotoZipHandle {
    if (!ids.length) {
      return {
        cancel: () => {},
        result: Promise.reject(new Error('No hay mediciones con foto para incluir.')),
      };
    }

    let cancelFn: () => void = () => {};
    const result = new Promise<PhotoZipResult>((resolve, reject) => {
      let cancelled = false;
      const body: { measurement_ids: number[]; period_label?: string } = { measurement_ids: ids };
      if (periodLabel?.trim()) body.period_label = periodLabel.trim();
      const sub = this.http
        .post(`${this.url}/photos-zip/`, body, {
          responseType: 'blob',
          observe: 'response',
        })
        .subscribe({
          next: (response: HttpResponse<Blob>) => {
            const blob = response.body ?? new Blob([], { type: 'application/zip' });
            const included = parseInt(response.headers.get('X-Photos-Included') ?? '0', 10);
            const skipped = parseInt(response.headers.get('X-Photos-Skipped') ?? '0', 10);
            resolve({ blob, included, skipped });
          },
          error: err => {
            if (cancelled) return; // ya rechazamos con ZIP_CANCELLED
            reject(err);
          },
        });

      cancelFn = () => {
        if (cancelled) return;
        cancelled = true;
        sub.unsubscribe();
        reject(ZIP_CANCELLED);
      };
    });

    return { result, cancel: () => cancelFn() };
  }

  triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.toLowerCase().endsWith('.zip') ? fileName : `${fileName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
