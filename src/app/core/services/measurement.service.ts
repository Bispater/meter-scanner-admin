import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Measurement, MeasurementAuditEntry, Summary } from '../models/measurement.model';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

interface ApiMeasurement {
  id: number;
  apartment: number;
  operator: number | null;
  cycle: number | null;
  reading_value: string | null;
  reading_layout?: string;
  ai_analysis_status?: string;
  ai_agrees_with_operator?: boolean | null;
  unit: string;
  photo: string | null;
  photo_url: string | null;
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
  cycle_name?: string | null;
  cycle_building_name?: string | null;
  ocr_value?: string;
  audit_logs?: ApiAudit[];
  deleted_at?: string | null;
  retention_days_remaining?: number | null;
  validated_by?: number | null;
  validated_by_name?: string | null;
  validated_at?: string | null;
  rejected_by?: number | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  rejection_category?: string | null;
  rejection_reason?: string | null;
}

interface ApiAudit {
  id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  note: string;
  created_at: string;
  edited_by_name: string | null;
}

interface ApiPage<T> { count: number; next: string | null; previous?: string | null; results: T[]; }

@Injectable({ providedIn: 'root' })
export class MeasurementService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly url = `${environment.apiUrl}/measurements`;

  private readonly _measurements = signal<Measurement[]>([]);
  private readonly _trash = signal<Measurement[]>([]);
  private readonly _summary = signal<Summary>({ total_readings_today: 0, pending_alerts: 0, total_consumption_m3: 0 });

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  private readonly _initialLoadPending = signal(true);
  readonly initialLoadPending = this._initialLoadPending.asReadonly();

  readonly measurements = this._measurements.asReadonly();
  readonly trash = this._trash.asReadonly();
  readonly summary = this._summary.asReadonly();

  readonly towers = computed(() => {
    const all = this._measurements();
    return [...new Set(all.map(m => m.tower))].sort();
  });

  readonly buildings = computed(() => {
    const all = this._measurements();
    return [...new Set(all.map(m => m.building_name).filter(Boolean))].sort();
  });

  private _onLoadedCallbacks: (() => void)[] = [];

  onLoaded(cb: () => void): void {
    this._onLoadedCallbacks.push(cb);
  }

  // ── Load from API ──

  loadAll(): void {
    this._loading.set(true);
    const acc: ApiMeasurement[] = [];
    const first = `${this.url}/?page_size=500&ordering=-captured_at`;
    const fetchPage = (url: string): void => {
      console.log('[MEASUREMENTS] GET', url);
      this.http.get<ApiPage<ApiMeasurement>>(url).subscribe({
        next: res => {
          acc.push(...(res.results ?? []));
          if (res.next) {
            // El backend ignora page_size grande y devuelve <=20 por página.
            // Seguir `next` hasta agotar resultados.
            fetchPage(res.next);
            return;
          }
          console.log('[MEASUREMENTS] Loaded:', acc.length, 'measurements (total declarado:', res.count, ')');
          const mapped = acc.map(m => this._mapMeasurement(m));
          this._measurements.set(mapped);
          this._computeSummary(mapped);
          this._loading.set(false);
          this._initialLoadPending.set(false);
          this._onLoadedCallbacks.forEach(cb => cb());
        },
        error: err => {
          this._loading.set(false);
          this._initialLoadPending.set(false);
          console.error('[MEASUREMENTS] Load error:', err);
          this.notify.error('Error al cargar mediciones');
        },
      });
    };
    fetchPage(first);
  }

  getFilteredMeasurements(filters: {
    tower?: string;
    apartment?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    /** Filtra por FK de ciclo (evita mezclar edificios al elegir un ciclo en el desplegable) */
    cycleId?: string;
    building?: string;
  }): Measurement[] {
    let result = this._measurements();

    if (filters.cycleId) {
      const want = String(filters.cycleId);
      result = result.filter(m => m.cycle_id != null && String(m.cycle_id) === want);
    }
    if (filters.building) {
      const q = filters.building.toLowerCase();
      result = result.filter(m => m.building_name.toLowerCase().includes(q));
    }
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

  getById(id: string): Measurement | undefined {
    return this._measurements().find(m => m.id === id);
  }

  /** @deprecated usar getById */
  getMeasurementById(id: string): Measurement | undefined {
    return this.getById(id);
  }

  /** Detalle con historial de auditoría (admin). */
  fetchDetail(id: string): Promise<Measurement | null> {
    return new Promise(resolve => {
      this.http.get<ApiMeasurement>(`${this.url}/${id}/`).subscribe({
        next: res => {
          const mapped = this._mapMeasurement(res);
          const list = [...this._measurements().filter(m => m.id !== id), mapped];
          list.sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
          this._measurements.set(list);
          this._computeSummary(list);
          resolve(mapped);
        },
        error: err => {
          console.error('[MEASUREMENTS] Detail error:', err);
          this.notify.error('Error al cargar el detalle');
          resolve(null);
        },
      });
    });
  }

  /**
   * Reasigna la medición a otro depto (FK apartment).
   * Útil cuando el operador escaneó un QR equivocado y se descubre viendo la foto.
   * Genera entrada de auditoría en BD (field_name='apartment').
   */
  reassignMeasurement(
    id: string,
    targetApartmentId: number,
    note?: string,
  ): Promise<Measurement | null> {
    const endpoint = `${this.url}/${id}/reassign/`;
    const body: { apartment_id: number; note?: string } = { apartment_id: targetApartmentId };
    if (note?.trim()) body.note = note.trim();
    return new Promise(resolve => {
      this.http.post<ApiMeasurement>(endpoint, body).subscribe({
        next: res => {
          const mapped = this._mapMeasurement(res);
          const updated = this._measurements().map(m => (m.id === id ? mapped : m));
          this._measurements.set(updated);
          this._computeSummary(updated);
          this.notify.success('Medición reasignada');
          resolve(mapped);
        },
        error: err => {
          console.error('[MEASUREMENTS] Reassign error:', err);
          const detail = err?.error?.apartment_id || err?.error?.detail || 'No se pudo reasignar la medición';
          this.notify.error(typeof detail === 'string' ? detail : 'No se pudo reasignar la medición');
          resolve(null);
        },
      });
    });
  }

  /** Edición de lectura / estado por administrador (genera auditoría en BD). */
  patchAdminFields(
    id: string,
    body: { reading_value?: number; status?: string; edit_note?: string },
  ): Promise<Measurement | null> {
    const endpoint = `${this.url}/${id}/`;
    return new Promise(resolve => {
      this.http.patch<ApiMeasurement>(endpoint, body).subscribe({
        next: res => {
          const mapped = this._mapMeasurement(res);
          const updated = this._measurements().map(m => (m.id === id ? mapped : m));
          this._measurements.set(updated);
          this._computeSummary(updated);
          this.notify.success('Medición actualizada');
          resolve(mapped);
        },
        error: err => {
          console.error('[MEASUREMENTS] Admin patch error:', err);
          this.notify.error('No se pudo guardar la edición');
          resolve(null);
        },
      });
    });
  }

  /** Returns all measurements for a given operator, sorted by date desc */
  getMeasurementsByOperator(operatorId: string): Measurement[] {
    return this._measurements()
      .filter(m => m.operator_id === operatorId)
      .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
  }

  /**
   * Groups measurements by year-month (last N months) and sums reading_value.
   * Returns { labels: string[], values: number[] }
   */
  getMonthlyConsumption(measurements: Measurement[], months = 12): { labels: string[]; values: number[] } {
    const now = new Date();
    const mNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const labels: string[] = [];
    const values: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${mNames[d.getMonth()]} ${d.getFullYear()}`);
      const total = measurements
        .filter(m => {
          const md = new Date(m.captured_at);
          return md.getFullYear() === d.getFullYear() && md.getMonth() === d.getMonth();
        })
        .reduce(
          (sum, m) =>
            sum + (m.reading_value != null && !Number.isNaN(m.reading_value) ? m.reading_value : 0),
          0,
        );
      values.push(Math.round(total * 100) / 100);
    }
    return { labels, values };
  }

  updateMeasurementStatus(id: string, status: string): Promise<Measurement | null> {
    const endpoint = `${this.url}/${id}/`;
    console.log('[MEASUREMENTS] PATCH', endpoint, { status });
    return new Promise(resolve => {
      this.http.patch<ApiMeasurement>(endpoint, { status }).subscribe({
        next: res => {
          console.log('[MEASUREMENTS] Status updated:', res);
          const mapped = this._mapMeasurement(res);
          const updated = this._measurements().map(m => m.id === id ? mapped : m);
          this._measurements.set(updated);
          this._computeSummary(updated);
          this.notify.success(
            status === 'verified' ? 'Medición validada' :
            status === 'rejected' ? 'Medición rechazada' :
            'Estado actualizado a pendiente'
          );
          resolve(mapped);
        },
        error: err => {
          console.error('[MEASUREMENTS] Status update error:', err);
          this.notify.error('Error al actualizar estado');
          resolve(null);
        },
      });
    });
  }

  deleteMeasurement(id: string): void {
    const endpoint = `${this.url}/${id}/`;
    console.log('[MEASUREMENTS] DELETE (soft)', endpoint);
    this.http.delete(endpoint).subscribe({
      next: () => {
        const updated = this._measurements().filter(m => m.id !== id);
        this._measurements.set(updated);
        this._computeSummary(updated);
        this.notify.success('Medición enviada a la papelera (30 días para recuperar)');
        this.loadTrash();
      },
      error: err => {
        console.error('[MEASUREMENTS] Delete error:', err);
        this.notify.error('Error al eliminar medición');
      },
    });
  }

  loadTrash(): void {
    const acc: ApiMeasurement[] = [];
    const first = `${this.url}/trash/?page_size=500`;
    const fetchPage = (url: string): void => {
      console.log('[MEASUREMENTS] GET trash', url);
      this.http.get<ApiPage<ApiMeasurement> | ApiMeasurement[]>(url).subscribe({
        next: res => {
          if (Array.isArray(res)) {
            acc.push(...res);
            this._trash.set(acc.map(m => this._mapMeasurement(m)));
            return;
          }
          acc.push(...(res.results ?? []));
          if (res.next) {
            fetchPage(res.next);
            return;
          }
          this._trash.set(acc.map(m => this._mapMeasurement(m)));
        },
        error: err => {
          console.error('[MEASUREMENTS] Trash load error:', err);
          this._trash.set([]);
        },
      });
    };
    fetchPage(first);
  }

  restoreMeasurement(id: string): Promise<Measurement | null> {
    const endpoint = `${this.url}/${id}/restore/`;
    console.log('[MEASUREMENTS] POST restore', endpoint);
    return new Promise(resolve => {
      this.http.post<ApiMeasurement>(endpoint, {}).subscribe({
        next: res => {
          const mapped = this._mapMeasurement(res);
          this._trash.set(this._trash().filter(m => m.id !== id));
          const merged = [mapped, ...this._measurements().filter(m => m.id !== id)];
          merged.sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
          this._measurements.set(merged);
          this._computeSummary(merged);
          this.notify.success('Medición restaurada');
          resolve(mapped);
        },
        error: err => {
          console.error('[MEASUREMENTS] Restore error:', err);
          this.notify.error('No se pudo restaurar (¿expiró el plazo de 30 días?)');
          resolve(null);
        },
      });
    });
  }

  // ── Mapper (API → Frontend) ──

  private _mapMeasurement(m: ApiMeasurement): Measurement {
    const audit: MeasurementAuditEntry[] | undefined = m.audit_logs?.map(a => ({
      id: a.id,
      field_name: a.field_name,
      old_value: a.old_value,
      new_value: a.new_value,
      note: a.note,
      created_at: a.created_at,
      edited_by_name: a.edited_by_name,
    }));
    return {
      id: String(m.id),
      meter_id: m.meter_id,
      building_name: m.building_name || '',
      tower: m.tower_name,
      apartment: m.apartment_number,
      reading_value:
        m.reading_value != null && String(m.reading_value).length > 0
          ? parseFloat(String(m.reading_value))
          : null,
      reading_layout: m.reading_layout === 'B' ? 'B' : 'A',
      ai_analysis_status: (m.ai_analysis_status as Measurement['ai_analysis_status']) ?? 'complete',
      ai_agrees_with_operator: m.ai_agrees_with_operator ?? null,
      unit: m.unit || 'm3',
      captured_at: m.captured_at,
      operator_id: m.operator ? String(m.operator) : '',
      operator_name: m.operator_name ?? undefined,
      photo_url: m.photo_url || m.photo || '',
      status: m.status as Measurement['status'],
      meter_type: m.meter_type as Measurement['meter_type'],
      location_coords: {
        lat: m.latitude ? parseFloat(m.latitude) : 0,
        lng: m.longitude ? parseFloat(m.longitude) : 0,
      },
      cycle_id: m.cycle != null ? String(m.cycle) : null,
      cycle_name: m.cycle_name ?? null,
      cycle_building_name: m.cycle_building_name ?? null,
      ocr_value: m.ocr_value,
      audit_logs: audit,
      deleted_at: m.deleted_at ?? undefined,
      retention_days_remaining: m.retention_days_remaining ?? undefined,
      validated_by: m.validated_by != null ? String(m.validated_by) : null,
      validated_by_name: m.validated_by_name ?? null,
      validated_at: m.validated_at ?? null,
      rejected_by: m.rejected_by != null ? String(m.rejected_by) : null,
      rejected_by_name: m.rejected_by_name ?? null,
      rejected_at: m.rejected_at ?? null,
      rejection_category: (m.rejection_category as Measurement['rejection_category']) ?? '',
      rejection_reason: m.rejection_reason ?? '',
    };
  }

  validateMeasurement(id: string): Promise<Measurement | null> {
    const endpoint = `${this.url}/${id}/validate/`;
    return new Promise(resolve => {
      this.http.post<ApiMeasurement>(endpoint, {}).subscribe({
        next: res => {
          const mapped = this._mapMeasurement(res);
          const updated = this._measurements().map(m => (m.id === id ? mapped : m));
          this._measurements.set(updated);
          this._computeSummary(updated);
          this.notify.success('Medición validada');
          resolve(mapped);
        },
        error: err => {
          console.error('[MEASUREMENTS] Validate error:', err);
          this.notify.error('No se pudo validar la medición');
          resolve(null);
        },
      });
    });
  }

  rejectMeasurement(id: string, category: string, reason: string): Promise<Measurement | null> {
    const endpoint = `${this.url}/${id}/reject/`;
    return new Promise(resolve => {
      this.http.post<ApiMeasurement>(endpoint, { category, reason }).subscribe({
        next: res => {
          const mapped = this._mapMeasurement(res);
          const updated = this._measurements().map(m => (m.id === id ? mapped : m));
          this._measurements.set(updated);
          this._computeSummary(updated);
          this.notify.success('Medición rechazada — operador notificado');
          resolve(mapped);
        },
        error: err => {
          console.error('[MEASUREMENTS] Reject error:', err);
          const msg = err?.error?.category || err?.error?.detail || 'No se pudo rechazar la medición';
          this.notify.error(typeof msg === 'string' ? msg : 'No se pudo rechazar la medición');
          resolve(null);
        },
      });
    });
  }

  private _computeSummary(measurements: Measurement[]): void {
    const today = new Date().toISOString().slice(0, 10);
    const todayMeasurements = measurements.filter(m => m.captured_at.slice(0, 10) === today);
    const pending = measurements.filter(m => m.status === 'pending_review').length;
    const total = measurements.reduce(
      (sum, m) => sum + (m.reading_value != null && !Number.isNaN(m.reading_value) ? m.reading_value : 0),
      0,
    );

    this._summary.set({
      total_readings_today: todayMeasurements.length,
      pending_alerts: pending,
      total_consumption_m3: Math.round(total * 100) / 100,
    });
  }
}
