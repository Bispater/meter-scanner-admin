import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppUser, UserRole } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

interface ApiUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  assigned_apartment_ids: number[];
}

interface ApiPage<T> { count: number; results: T[]; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly url = `${environment.apiUrl}/accounts/users`;

  private readonly _users = signal<AppUser[]>([]);
  readonly users = this._users.asReadonly();

  readonly operators = computed(() => this._users().filter(u => u.role === 'operator'));
  readonly activeOperators = computed(() => this.operators().filter(u => u.active));

  // ── Load from API ──

  loadAll(): void {
    console.log('[USERS] GET', `${this.url}/?page_size=200`);
    this.http.get<ApiPage<ApiUser>>(`${this.url}/?page_size=200`).subscribe({
      next: res => {
        console.log('[USERS] Loaded:', res.count, 'users', res.results);
        this._users.set(res.results.map(u => this._mapUser(u)));
      },
      error: err => {
        console.error('[USERS] Load error:', err);
        this.notify.error('Error al cargar usuarios');
      },
    });
  }

  // ── CRUD ──

  addUser(data: any): void {
    const body: any = {
      username: data.username,
      password: data.password,
      email: data.email || '',
      first_name: data.displayName?.split(' ')[0] || '',
      last_name: data.displayName?.split(' ').slice(1).join(' ') || '',
      phone: data.phone || '',
      role: data.role || 'operator',
      is_active: data.active ?? true,
    };
    console.log('[USERS] POST /users/', body);
    this.http.post(`${this.url}/`, body).subscribe({
      next: res => {
        console.log('[USERS] Created:', res);
        this.notify.success(`Usuario "${data.username}" creado`);
        this.loadAll();
      },
      error: err => {
        console.error('[USERS] Create error:', err);
        this.notify.error('Error al crear usuario');
      },
    });
  }

  updateUser(id: string, patch: any): void {
    const body: any = {};
    if (patch.username) body.username = patch.username;
    if (patch.email !== undefined) body.email = patch.email;
    if (patch.phone !== undefined) body.phone = patch.phone;
    if (patch.role) body.role = patch.role;
    if (patch.active !== undefined) body.is_active = patch.active;
    if (patch.password) body.password = patch.password;
    if (patch.displayName) {
      body.first_name = patch.displayName.split(' ')[0] || '';
      body.last_name = patch.displayName.split(' ').slice(1).join(' ') || '';
    }
    console.log('[USERS] PATCH /users/' + id, body);
    this.http.patch(`${this.url}/${id}/`, body).subscribe({
      next: res => {
        console.log('[USERS] Updated:', res);
        this.notify.success('Usuario actualizado');
        this.loadAll();
      },
      error: err => {
        console.error('[USERS] Update error:', err);
        this.notify.error('Error al actualizar usuario');
      },
    });
  }

  deleteUser(id: string): void {
    console.log('[USERS] DELETE /users/' + id);
    this.http.delete(`${this.url}/${id}/`).subscribe({
      next: () => {
        console.log('[USERS] Deleted user', id);
        this.notify.success('Usuario eliminado');
        this.loadAll();
      },
      error: err => {
        console.error('[USERS] Delete error:', err);
        this.notify.error('Error al eliminar usuario');
      },
    });
  }

  toggleActive(id: string): void {
    const user = this._users().find(u => u.id === id);
    if (user) {
      const newState = !user.active;
      console.log('[USERS] PATCH /users/' + id, { is_active: newState });
      this.http.patch(`${this.url}/${id}/`, { is_active: newState }).subscribe({
        next: res => {
          console.log('[USERS] Toggle active:', res);
          this.notify.success(`Usuario ${newState ? 'activado' : 'desactivado'}`);
          this.loadAll();
        },
        error: err => {
          console.error('[USERS] Toggle error:', err);
          this.notify.error('Error al cambiar estado del usuario');
        },
      });
    }
  }

  // ── Assignment helpers ──

  assignApartments(userId: string, apartmentIds: string[]): void {
    const payload = { apartment_ids: apartmentIds.map(Number) };
    console.log('[USERS] POST /users/' + userId + '/assign-apartments/', payload);
    this.http.post(`${this.url}/${userId}/assign-apartments/`, payload).subscribe({
      next: res => {
        console.log('[USERS] Assigned apartments:', res);
        this.notify.success(`${apartmentIds.length} departamentos asignados`);
        this.loadAll();
      },
      error: err => {
        console.error('[USERS] Assign error:', err);
        this.notify.error('Error al asignar departamentos');
      },
    });
  }

  assignAll(userId: string, allApartmentIds: string[]): void {
    this.assignApartments(userId, allApartmentIds);
  }

  clearAssignments(userId: string): void {
    this.assignApartments(userId, []);
  }

  getUserById(id: string): AppUser | undefined {
    return this._users().find(u => u.id === id);
  }

  getUsersByApartment(aptId: string): AppUser[] {
    return this._users().filter(u => u.assignedApartmentIds.includes(aptId));
  }

  // ── Mapper (API → Frontend) ──

  private _mapUser(u: ApiUser): AppUser {
    return {
      id: String(u.id),
      username: u.username,
      displayName: `${u.first_name} ${u.last_name}`.trim() || u.username,
      email: u.email,
      phone: u.phone,
      role: u.role as UserRole,
      active: u.is_active,
      createdAt: u.date_joined,
      assignedApartmentIds: (u.assigned_apartment_ids || []).map(String),
    };
  }
}
