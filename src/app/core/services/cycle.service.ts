import { Injectable, inject, signal } from '@angular/core';
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

  loadAll(): void {
    this.http.get<ApiPage<MeasurementCycle>>(`${this.url}/?page_size=200&ordering=-year,-month`).subscribe({
      next: res => this._cycles.set(res.results),
      error: () => this.notify.error('Error al cargar ciclos'),
    });
  }

  getCycleProgress(cycleId: string) {
    return this.http.get<CycleProgressResponse>(`${this.url}/${cycleId}/progress/`);
  }

  createCycle(data: {
    name: string;
    building: number;
    year: number;
    month: number;
    scheduled_date: string;
    deadline: string;
    status: string;
    notes: string;
  }) {
    return new Promise<void>((resolve, reject) => {
      this.http.post(`${this.url}/`, data).subscribe({
        next: () => {
          this.notify.success(`Ciclo "${data.name}" creado`);
          this.loadAll();
          resolve();
        },
        error: err => {
          this.notify.error('Error al crear ciclo');
          reject(err);
        },
      });
    });
  }

  updateCycleStatus(id: string, status: string): void {
    this.http.patch(`${this.url}/${id}/`, { status }).subscribe({
      next: () => {
        this.notify.success('Estado del ciclo actualizado');
        this.loadAll();
      },
      error: () => this.notify.error('Error al actualizar ciclo'),
    });
  }

  deleteCycle(id: string): void {
    this.http.delete(`${this.url}/${id}/`).subscribe({
      next: () => {
        this.notify.success('Ciclo eliminado');
        this.loadAll();
      },
      error: () => this.notify.error('Error al eliminar ciclo'),
    });
  }
}
