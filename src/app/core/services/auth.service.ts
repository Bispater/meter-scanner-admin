import { Injectable, inject, signal, computed } from '@angular/core';
import { AppUser } from '../models/user.model';
import { UserService } from './user.service';

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userService = inject(UserService);
  private readonly _user = signal<SessionUser | null>(this._loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  login(username: string, password: string): boolean {
    const appUser = this.userService.authenticate(username, password);
    if (appUser) {
      const session: SessionUser = {
        id: appUser.id,
        username: appUser.username,
        displayName: appUser.displayName,
        role: appUser.role,
      };
      this._user.set(session);
      sessionStorage.setItem('hydroscan_user', JSON.stringify(session));
      return true;
    }
    return false;
  }

  logout(): void {
    this._user.set(null);
    sessionStorage.removeItem('hydroscan_user');
  }

  private _loadUser(): SessionUser | null {
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
