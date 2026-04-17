import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  member_count: number;
  building_count: number;
}

interface ApiPage<T> { count: number; results: T[]; }

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly url = `${environment.apiUrl}/accounts/organizations`;

  private readonly _orgs = signal<Organization[]>([]);
  readonly orgs = this._orgs.asReadonly();

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  /** Only used when loadAll runs (superadmin); stays false if never loaded. */
  private readonly _initialLoadPending = signal(false);
  readonly initialLoadPending = this._initialLoadPending.asReadonly();

  loadAll(): void {
    this._initialLoadPending.set(true);
    this._loading.set(true);
    this.http
      .get<ApiPage<Organization>>(`${this.url}/?page_size=200`)
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._initialLoadPending.set(false);
        }),
      )
      .subscribe({
        next: res => this._orgs.set(res.results),
        error: err => {
          console.error('[ORG] Load error:', err);
          this.notify.error('Error al cargar organizaciones');
        },
      });
  }

  create(name: string, slug: string): Promise<Organization> {
    return new Promise((resolve, reject) => {
      this.http.post<Organization>(`${this.url}/`, { name, slug }).subscribe({
        next: org => {
          this.notify.success(`Organización "${org.name}" creada`);
          this.loadAll();
          resolve(org);
        },
        error: err => {
          this.notify.error('Error al crear organización');
          reject(err);
        },
      });
    });
  }

  update(id: number, patch: Partial<Pick<Organization, 'name' | 'slug'>>): void {
    this.http.patch(`${this.url}/${id}/`, patch).subscribe({
      next: () => {
        this.notify.success('Organización actualizada');
        this.loadAll();
      },
      error: () => this.notify.error('Error al actualizar organización'),
    });
  }

  delete(id: number): void {
    this.http.delete(`${this.url}/${id}/`).subscribe({
      next: () => {
        this.notify.success('Organización eliminada');
        this.loadAll();
      },
      error: () => this.notify.error('Error al eliminar organización'),
    });
  }
}
