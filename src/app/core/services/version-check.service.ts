import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { APP_VERSION } from '../../../environments/version';

/**
 * Detecta despliegues nuevos sin que el usuario recargue la página.
 *
 * El build lleva compilada APP_VERSION (src/environments/version.ts) y el hosting
 * sirve la misma versión en /version.json (ambas estampadas por
 * scripts/stamp-version.mjs). Este servicio consulta el JSON cada 5 minutos y
 * al volver a la pestaña; si difiere de la compilada, expone `updateAvailable`
 * para que el layout muestre el aviso «hay una nueva versión disponible».
 */
@Injectable({ providedIn: 'root' })
export class VersionCheckService {
  private readonly http = inject(HttpClient);

  /** Versión compilada dentro de este bundle (formato AAAAMMDD.HHMM). */
  readonly currentVersion = APP_VERSION;

  private readonly _updateAvailable = signal(false);
  readonly updateAvailable = this._updateAvailable.asReadonly();

  private timer: ReturnType<typeof setInterval> | null = null;

  /** Idempotente: arranca el chequeo periódico (5 min) + al recuperar foco la pestaña. */
  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.checkNow(), 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkNow();
    });
    // Primer chequeo a los 30 s de entrar (no compite con la carga inicial).
    setTimeout(() => this.checkNow(), 30_000);
  }

  checkNow(): void {
    if (this._updateAvailable()) return;
    // Query param + no-store: evita que un intermediario devuelva un JSON cacheado.
    this.http
      .get<{ version?: string }>(`/version.json?t=${Date.now()}`)
      .subscribe({
        next: res => {
          if (res?.version && res.version !== APP_VERSION) {
            this._updateAvailable.set(true);
          }
        },
        // Silencioso: sin red o hosting caído no debe molestar al usuario.
        error: () => {},
      });
  }

  /** Recarga forzada para tomar el bundle nuevo (los assets van con hash en el nombre). */
  reloadApp(): void {
    location.reload();
  }
}
