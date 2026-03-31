import { Injectable, signal, computed } from '@angular/core';
import { AppUser, UserRole } from '../models/user.model';

const SEED_USERS: AppUser[] = [
  {
    id: 'usr-001',
    username: 'admin',
    password: 'admin',
    displayName: 'Administrador',
    email: 'admin@hydroscan.cl',
    phone: '+56 9 1234 5678',
    role: 'admin',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    assignedApartmentIds: [],
  },
  {
    id: 'usr-002',
    username: 'jperez',
    password: '1234',
    displayName: 'Juan Pérez',
    email: 'jperez@hydroscan.cl',
    phone: '+56 9 8765 4321',
    role: 'operator',
    active: true,
    createdAt: '2026-02-15T00:00:00Z',
    assignedApartmentIds: ['apt-001', 'apt-002', 'apt-003', 'apt-004', 'apt-005', 'apt-006', 'apt-007'],
  },
  {
    id: 'usr-003',
    username: 'mlopez',
    password: '1234',
    displayName: 'María López',
    email: 'mlopez@hydroscan.cl',
    phone: '+56 9 5555 1234',
    role: 'operator',
    active: true,
    createdAt: '2026-03-01T00:00:00Z',
    assignedApartmentIds: ['apt-008', 'apt-009', 'apt-010', 'apt-011', 'apt-012'],
  },
  {
    id: 'usr-004',
    username: 'cgarcia',
    password: '1234',
    displayName: 'Carlos García',
    email: 'cgarcia@hydroscan.cl',
    phone: '+56 9 7777 9999',
    role: 'operator',
    active: false,
    createdAt: '2026-03-10T00:00:00Z',
    assignedApartmentIds: [],
  },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly _users = signal<AppUser[]>(SEED_USERS);
  readonly users = this._users.asReadonly();

  readonly operators = computed(() => this._users().filter(u => u.role === 'operator'));
  readonly activeOperators = computed(() => this.operators().filter(u => u.active));

  // ── Auth lookup ──

  authenticate(username: string, password: string): AppUser | null {
    const user = this._users().find(
      u => u.username === username && u.password === password && u.active,
    );
    return user ?? null;
  }

  // ── CRUD ──

  addUser(data: Omit<AppUser, 'id' | 'createdAt'>): AppUser {
    const user: AppUser = {
      ...data,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this._users.update(list => [...list, user]);
    return user;
  }

  updateUser(id: string, patch: Partial<Omit<AppUser, 'id' | 'createdAt'>>): void {
    this._users.update(list =>
      list.map(u => (u.id === id ? { ...u, ...patch } : u)),
    );
  }

  deleteUser(id: string): void {
    this._users.update(list => list.filter(u => u.id !== id));
  }

  toggleActive(id: string): void {
    this._users.update(list =>
      list.map(u => (u.id === id ? { ...u, active: !u.active } : u)),
    );
  }

  // ── Assignment helpers ──

  assignApartments(userId: string, apartmentIds: string[]): void {
    this.updateUser(userId, { assignedApartmentIds: apartmentIds });
  }

  /** Assign ALL apartments to an operator (convenience) */
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
}
