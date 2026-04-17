import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  leaving: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void { this._add('success', message, 3500); }
  error(message: string): void   { this._add('error',   message, 5000); }
  info(message: string): void    { this._add('info',    message, 3500); }
  warning(message: string): void { this._add('warning', message, 4000); }

  dismiss(id: string): void {
    // Mark as leaving first (triggers exit animation)
    this._toasts.update(ts => ts.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => {
      this._toasts.update(ts => ts.filter(t => t.id !== id));
    }, 280);
  }

  private _add(type: ToastType, message: string, duration: number): void {
    const id = crypto.randomUUID();
    this._toasts.update(ts => [...ts, { id, type, message, duration, leaving: false }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
