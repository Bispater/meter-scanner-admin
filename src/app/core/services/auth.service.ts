import { Injectable, signal, computed } from '@angular/core';

export interface User {
  username: string;
  displayName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(this._loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin') {
      const user: User = {
        username: 'admin',
        displayName: 'Administrador',
        role: 'admin',
      };
      this._user.set(user);
      sessionStorage.setItem('hydroscan_user', JSON.stringify(user));
      return true;
    }
    return false;
  }

  logout(): void {
    this._user.set(null);
    sessionStorage.removeItem('hydroscan_user');
  }

  private _loadUser(): User | null {
    const stored = sessionStorage.getItem('hydroscan_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }
}
