import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { MeasurementCycle, CycleProgressResponse } from '../models/cycle.model';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

interface ApiPage<T> { count: number; results: T[]; }

@Injectable({ providedIn: 'root' })
export class CycleService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly url = `${environment.apiUrl}/cycles`;

  private readonly _cycles = signal<MeasurementCycle[]>([]);
  readonly cycles = this._cycles.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  private readonly _initialLoadPending = signal(true);
  readonly initialLoadPending = this._initialLoadPending.asReadonly();

  loadAll(): void {
    const endpoint = `${this.url}/?page_size=200&ordering=-year,-month`;
    console.log('[CYCLES] GET', endpoint);
    this._loading.set(true);
    this.http
      .get<ApiPage<MeasurementCycle>>(endpoint)
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._initialLoadPending.set(false);
        }),
      )
      .subscribe({
        next: res => {
          console.log('[CYCLES] Loaded:', res.count, 'cycles', res.results);
          this._cycles.set(res.results);
        },
        error: err => {
          console.error('[CYCLES] Load error:', err);
          this.notify.error('Error al cargar ciclos');
        },
      });
  }

  getCycleProgress(cycleId: string) {
    const endpoint = `${this.url}/${cycleId}/progress/`;
    console.log('[CYCLES] GET progress', endpoint);
    return this.http.get<CycleProgressResponse>(endpoint);
  }

  createCycle(data: {
    name: string;
    building: number | null;
    year: number;
    month: number;
    scheduled_date: string;
    deadline: string;
    status: string;
    enforce: boolean;
    apartment_ids: number[];
    notes: string;
  }) {
    const payload = {
      ...data,
      building: Number(data.building),
    };
    console.log('[CYCLES] POST /', payload);
    return new Promise<void>((resolve, reject) => {
      this.http.post(`${this.url}/`, payload).subscribe({
        next: res => {
          console.log('[CYCLES] Created:', res);
          this.notify.success(`Ciclo "${data.name}" creado`);
          this.loadAll();
          resolve();
        },
        error: err => {
          console.error('[CYCLES] Create error:', err);
          const detail = err.error;
          if (detail && typeof detail === 'object') {
            const messages = Object.entries(detail)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join(' | ');
            this.notify.error(`Error: ${messages}`);
          } else {
            this.notify.error('Error al crear ciclo');
          }
          reject(err);
        },
      });
    });
  }

  updateCycle(id: string, patch: Record<string, any>): void {
    console.log('[CYCLES] PATCH /' + id, patch);
    this.http.patch(`${this.url}/${id}/`, patch).subscribe({
      next: res => {
        console.log('[CYCLES] Updated:', res);
        this.notify.success('Ciclo actualizado');
        this.loadAll();
      },
      error: err => {
        console.error('[CYCLES] Update error:', err);
        this.notify.error('Error al actualizar ciclo');
      },
    });
  }

  updateCycleStatus(id: string, status: string): void {
    this.updateCycle(id, { status });
  }

  deleteCycle(id: string): void {
    console.log('[CYCLES] DELETE /' + id);
    this.http.delete(`${this.url}/${id}/`).subscribe({
      next: () => {
        console.log('[CYCLES] Deleted cycle', id);
        this.notify.success('Ciclo eliminado');
        this.loadAll();
      },
      error: err => {
        console.error('[CYCLES] Delete error:', err);
        this.notify.error('Error al eliminar ciclo');
      },
    });
  }
}
