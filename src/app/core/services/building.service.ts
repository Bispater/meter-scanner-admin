import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Building, Tower, Apartment, ReadingLayout } from '../models/building.model';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

interface ApiApartment {
  id: number;
  number: string;
  floor: number;
  meter_id: string;
  qr_code: string;
  reading_layout: string;
  tower: number;
}

interface ApiTower {
  id: number;
  name: string;
  building: number;
  apartments: ApiApartment[];
  apartment_count: number;
}

interface ApiBuilding {
  id: number;
  name: string;
  address: string;
  created_at: string;
  towers: ApiTower[];
  tower_count: number;
  apartment_count: number;
}

interface ApiPage<T> { count: number; results: T[]; }

@Injectable({ providedIn: 'root' })
export class BuildingService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly url = `${environment.apiUrl}/buildings`;

  private readonly _buildings = signal<Building[]>([]);
  readonly buildings = this._buildings.asReadonly();

  /** Flat list of all towers across all buildings */
  readonly allTowers = computed(() =>
    this._buildings().flatMap(b => b.towers.map(t => ({ ...t, buildingId: b.id, buildingName: b.name }))),
  );

  /** Flat list of all apartments across all buildings/towers */
  readonly allApartments = computed(() =>
    this._buildings().flatMap(b =>
      b.towers.flatMap(t =>
        t.apartments.map(a => ({
          ...a,
          towerId: t.id,
          towerName: t.name,
          buildingId: b.id,
          buildingName: b.name,
        })),
      ),
    ),
  );

  // ── Load from API ──

  loadAll(): void {
    console.log('[BUILDINGS] GET', `${this.url}/buildings/?page_size=200`);
    this.http.get<ApiPage<ApiBuilding>>(`${this.url}/buildings/?page_size=200`).subscribe({
      next: res => {
        console.log('[BUILDINGS] Loaded:', res.count, 'buildings', res.results);
        this._buildings.set(res.results.map(b => this._mapBuilding(b)));
      },
      error: err => {
        console.error('[BUILDINGS] Load error:', err);
        this.notify.error('Error al cargar edificios');
      },
    });
  }

  // ── CRUD Buildings ──

  addBuilding(name: string, address: string): void {
    const payload = { name, address };
    console.log('[BUILDINGS] POST /buildings/', payload);
    this.http.post(`${this.url}/buildings/`, payload).subscribe({
      next: res => {
        console.log('[BUILDINGS] Created:', res);
        this.notify.success(`Edificio "${name}" creado`);
        this.loadAll();
      },
      error: err => {
        console.error('[BUILDINGS] Create error:', err);
        this.notify.error('Error al crear edificio');
      },
    });
  }

  updateBuilding(id: string, patch: Partial<Pick<Building, 'name' | 'address'>>): void {
    console.log('[BUILDINGS] PATCH /buildings/' + id, patch);
    this.http.patch(`${this.url}/buildings/${id}/`, patch).subscribe({
      next: res => {
        console.log('[BUILDINGS] Updated:', res);
        this.notify.success('Edificio actualizado');
        this.loadAll();
      },
      error: err => {
        console.error('[BUILDINGS] Update error:', err);
        this.notify.error('Error al actualizar edificio');
      },
    });
  }

  deleteBuilding(id: string): void {
    console.log('[BUILDINGS] DELETE /buildings/' + id);
    this.http.delete(`${this.url}/buildings/${id}/`).subscribe({
      next: () => {
        console.log('[BUILDINGS] Deleted building', id);
        this.notify.success('Edificio eliminado');
        this.loadAll();
      },
      error: err => {
        console.error('[BUILDINGS] Delete error:', err);
        this.notify.error('Error al eliminar edificio');
      },
    });
  }

  // ── CRUD Towers ──

  addTower(buildingId: string, name: string): void {
    const payload = { name, building: Number(buildingId) };
    console.log('[BUILDINGS] POST /towers/', payload);
    this.http.post(`${this.url}/towers/`, payload).subscribe({
      next: res => {
        console.log('[BUILDINGS] Tower created:', res);
        this.notify.success(`Torre "${name}" creada`);
        this.loadAll();
      },
      error: err => {
        console.error('[BUILDINGS] Tower create error:', err);
        this.notify.error('Error al crear torre');
      },
    });
  }

  deleteTower(_buildingId: string, towerId: string): void {
    console.log('[BUILDINGS] DELETE /towers/' + towerId);
    this.http.delete(`${this.url}/towers/${towerId}/`).subscribe({
      next: () => {
        console.log('[BUILDINGS] Deleted tower', towerId);
        this.notify.success('Torre eliminada');
        this.loadAll();
      },
      error: err => {
        console.error('[BUILDINGS] Tower delete error:', err);
        this.notify.error('Error al eliminar torre');
      },
    });
  }

  // ── CRUD Apartments ──

  addApartment(_buildingId: string, towerId: string, apt: Omit<Apartment, 'id'>): Observable<unknown> {
    const payload = {
      number: apt.number,
      floor: apt.floor,
      meter_id: apt.meterId,
      reading_layout: apt.readingLayout,
      tower: Number(towerId),
    };
    console.log('[BUILDINGS] POST /apartments/', payload);
    return this.http.post(`${this.url}/apartments/`, payload).pipe(
      tap({
        next: res => {
          console.log('[BUILDINGS] Apartment created:', res);
          this.notify.success(`Depto "${apt.number}" creado`);
          this.loadAll();
        },
        error: err => {
          console.error('[BUILDINGS] Apartment create error:', err);
          this.notify.error('Error al crear departamento');
        },
      }),
    );
  }

  bulkAddApartments(towerId: string, apts: Omit<Apartment, 'id'>[]): Promise<number> {
    const payload = {
      tower: Number(towerId),
      apartments: apts.map(a => ({
        number: a.number,
        floor: a.floor,
        meter_id: a.meterId,
        reading_layout: a.readingLayout,
      })),
    };
    console.log('[BUILDINGS] POST /apartments/bulk-create', payload.apartments.length, 'items');
    return new Promise((resolve, reject) => {
      this.http.post<{ created: number }>(`${this.url}/apartments/bulk-create/`, payload).subscribe({
        next: res => {
          console.log('[BUILDINGS] Bulk apartments created:', res.created);
          this.notify.success(`${res.created} departamentos creados`);
          this.loadAll();
          resolve(res.created);
        },
        error: err => {
          console.error('[BUILDINGS] Bulk create error:', err);
          this.notify.error('Error al crear departamentos masivamente');
          reject(err);
        },
      });
    });
  }

  deleteApartment(_buildingId: string, _towerId: string, aptId: string): void {
    console.log('[BUILDINGS] DELETE /apartments/' + aptId);
    this.http.delete(`${this.url}/apartments/${aptId}/`).subscribe({
      next: () => {
        console.log('[BUILDINGS] Deleted apartment', aptId);
        this.notify.success('Departamento eliminado');
        this.loadAll();
      },
      error: err => {
        console.error('[BUILDINGS] Apartment delete error:', err);
        this.notify.error('Error al eliminar departamento');
      },
    });
  }

  // ── Lookups ──

  getBuildingById(id: string): Building | undefined {
    return this._buildings().find(b => b.id === id);
  }

  getApartmentById(aptId: string): (Apartment & { towerName: string; buildingName: string }) | undefined {
    return this.allApartments().find(a => a.id === aptId);
  }

  // ── Mappers (API → Frontend) ──

  private _mapBuilding(b: ApiBuilding): Building {
    return {
      id: String(b.id),
      name: b.name,
      address: b.address,
      towers: (b.towers || []).map(t => this._mapTower(t)),
    };
  }

  private _mapTower(t: ApiTower): Tower {
    return {
      id: String(t.id),
      name: t.name,
      apartments: (t.apartments || []).map(a => this._mapApartment(a, t.name)),
    };
  }

  private _mapApartment(a: ApiApartment, towerName?: string): Apartment {
    const towerShort = towerName
      ? towerName.replace(/^[Tt]orre\s+/, '').trim()
      : ((a as any)._towerName as string | undefined)?.replace(/^[Tt]orre\s+/, '').trim() ?? '';
    const layout = a.reading_layout === 'B' ? 'B' : 'A';
    return {
      id: String(a.id),
      number: a.number,
      floor: a.floor,
      meterId: a.meter_id ?? '',
      readingLayout: layout as ReadingLayout,
      qrCode: a.qr_code || `${a.number}${towerShort}`,
    };
  }

  updateApartment(
    aptId: string,
    patch: Partial<Pick<Apartment, 'number' | 'meterId' | 'readingLayout'>>,
  ): void {
    const body: { number?: string; meter_id?: string; reading_layout?: string } = {};
    if (patch.number !== undefined) body.number = patch.number;
    if (patch.meterId !== undefined) body.meter_id = patch.meterId;
    if (patch.readingLayout !== undefined) body.reading_layout = patch.readingLayout;
    console.log('[BUILDINGS] PATCH /apartments/' + aptId, body);
    this.http.patch(`${this.url}/apartments/${aptId}/`, body).subscribe({
      next: res => {
        console.log('[BUILDINGS] Apartment updated:', res);
        this.notify.success('Departamento actualizado');
        this.loadAll();
      },
      error: err => {
        console.error('[BUILDINGS] Apartment update error:', err);
        this.notify.error('Error al actualizar departamento');
      },
    });
  }
}
