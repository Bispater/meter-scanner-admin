import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DemoModeService {
  private readonly _active = signal(false);
  readonly isActive = this._active.asReadonly();

  activate(): void { this._active.set(true); }

  deactivate(): void { this._active.set(false); }
}
