import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface JwtResponse {
  access: string;
  refresh: string;
}

interface MeResponse {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly notify = inject(NotificationService);
  private readonly _user = signal<SessionUser | null>(this._loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'admin');

  async login(username: string, password: string): Promise<boolean> {
    try {
      const payload = { username, password };
      console.log('[AUTH] Login payload:', payload);

      const jwt = await firstValueFrom(
        this.http.post<JwtResponse>(`${environment.apiUrl}/auth/login/`, payload),
      );
      console.log('[AUTH] JWT response:', { access: jwt.access.slice(0, 20) + '...', refresh: jwt.refresh.slice(0, 20) + '...' });
      sessionStorage.setItem('hydroscan_access_token', jwt.access);
      sessionStorage.setItem('hydroscan_refresh_token', jwt.refresh);

      const me = await firstValueFrom(
        this.http.get<MeResponse>(`${environment.apiUrl}/accounts/users/me/`, {
          headers: { Authorization: `Bearer ${jwt.access}` },
        }),
      );
      console.log('[AUTH] User profile:', me);

      const session: SessionUser = {
        id: String(me.id),
        username: me.username,
        displayName: `${me.first_name} ${me.last_name}`.trim() || me.username,
        role: me.role,
      };
      this._user.set(session);
      sessionStorage.setItem('hydroscan_user', JSON.stringify(session));
      this.notify.success(`Bienvenido, ${session.displayName}`);
      return true;
    } catch (err) {
      console.error('[AUTH] Login error:', err);
      this.notify.error('Error al iniciar sesión');
      return false;
    }
  }

  logout(): void {
    this._user.set(null);
    sessionStorage.removeItem('hydroscan_user');
    sessionStorage.removeItem('hydroscan_access_token');
    sessionStorage.removeItem('hydroscan_refresh_token');
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('hydroscan_access_token');
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
