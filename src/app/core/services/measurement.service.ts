import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Measurement, Summary } from '../models/measurement.model';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

interface ApiMeasurement {
  id: number;
  apartment: number;
  operator: number | null;
  reading_value: string;
  unit: string;
  photo: string | null;
  status: string;
  meter_type: string;
  latitude: string | null;
  longitude: string | null;
  captured_at: string;
  created_at: string;
  tower_name: string;
  building_name: string;
  apartment_number: string;
  meter_id: string;
  operator_name: string | null;
}

interface ApiPage<T> { count: number; results: T[]; }

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly url = `${environment.apiUrl}/measurements`;

  private readonly _measurements = signal<Measurement[]>([]);
  private readonly _summary = signal<Summary>({ total_readings_today: 0, pending_alerts: 0, total_consumption_m3: 0 });

  readonly measurements = this._measurements.asReadonly();
  readonly summary = this._summary.asReadonly();

  readonly towers = computed(() => {
    const all = this._measurements();
    return [...new Set(all.map(m => m.tower))].sort();
  });

  // ── Load from API ──

  loadAll(): void {
    const endpoint = `${this.url}/?page_size=500&ordering=-captured_at`;
    console.log('[MEASUREMENTS] GET', endpoint);
    this.http.get<ApiPage<ApiMeasurement>>(endpoint).subscribe({
      next: res => {
        console.log('[MEASUREMENTS] Loaded:', res.count, 'measurements', res.results);
        const mapped = res.results.map(m => this._mapMeasurement(m));
        this._measurements.set(mapped);
        this._computeSummary(mapped);
      },
      error: err => {
        console.error('[MEASUREMENTS] Load error:', err);
        this.notify.error('Error al cargar mediciones');
      },
    });
  }

  getFilteredMeasurements(filters: {
    tower?: string;
    apartment?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }): Measurement[] {
    let result = this._measurements();

    if (filters.tower) {
      result = result.filter(m => m.tower === filters.tower);
    }
    if (filters.apartment) {
      result = result.filter(m =>
        m.apartment.toLowerCase().includes(filters.apartment!.toLowerCase())
      );
    }
    if (filters.status) {
      result = result.filter(m => m.status === filters.status);
    }
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      result = result.filter(m => new Date(m.captured_at) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59);
      result = result.filter(m => new Date(m.captured_at) <= to);
    }

    return result.sort((a, b) =>
      new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
    );
  }

  getMeasurementById(id: string): Measurement | undefined {
    return this._measurements().find(m => m.id === id);
  }

  // ── Mapper (API → Frontend) ──

  private _mapMeasurement(m: ApiMeasurement): Measurement {
    return {
      id: String(m.id),
      meter_id: m.meter_id,
      tower: m.tower_name,
      apartment: m.apartment_number,
      reading_value: parseFloat(m.reading_value),
      unit: m.unit || 'm3',
      captured_at: m.captured_at,
      operator_id: m.operator ? String(m.operator) : '',
      photo_url: m.photo || '',
      status: m.status as Measurement['status'],
      meter_type: m.meter_type as Measurement['meter_type'],
      location_coords: {
        lat: m.latitude ? parseFloat(m.latitude) : 0,
        lng: m.longitude ? parseFloat(m.longitude) : 0,
      },
    };
  }

  private _computeSummary(measurements: Measurement[]): void {
    const today = new Date().toISOString().slice(0, 10);
    const todayMeasurements = measurements.filter(m => m.captured_at.slice(0, 10) === today);
    const pending = measurements.filter(m => m.status === 'pending_review').length;
    const total = measurements.reduce((sum, m) => sum + m.reading_value, 0);

    this._summary.set({
      total_readings_today: todayMeasurements.length,
      pending_alerts: pending,
      total_consumption_m3: Math.round(total * 100) / 100,
    });
  }
}
