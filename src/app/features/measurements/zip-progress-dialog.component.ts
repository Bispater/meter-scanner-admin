import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ZipProgressDialogData {
  /** Cantidad de fotos solicitadas (para mostrar en el texto). */
  count: number;
  /** Función que aborta la petición HTTP cuando el usuario hace click en Cancelar. */
  cancel: () => void;
}

/**
 * Modal bloqueante mientras el backend arma el ZIP. Se cierra con `'cancelled'`
 * si el usuario presiona Cancelar; el caller cierra con `undefined` cuando el
 * download termina (ok o error). `disableClose` evita que un click fuera lo cierre.
 */
@Component({
  selector: 'app-zip-progress-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="bg-slate-800 text-slate-200 p-6 max-w-[440px] w-[92vw]">
      <div class="flex items-center gap-4 mb-4">
        <mat-spinner diameter="40" strokeWidth="3"></mat-spinner>
        <div class="min-w-0">
          <h2 class="text-base font-bold text-white">Preparando ZIP</h2>
          <p class="text-xs text-slate-400 mt-0.5">{{ data.count }} foto{{ data.count === 1 ? '' : 's' }} · esto puede tardar segundos</p>
        </div>
      </div>

      <p class="text-xs text-slate-500 leading-relaxed">
        El servidor está leyendo y comprimiendo las fotos en carpetas
        <span class="text-slate-400 font-mono">Edificio/Torre/</span>.
        El navegador comenzará la descarga apenas el archivo esté listo.
      </p>

      @if (cancelling()) {
        <p class="text-[11px] text-amber-300 mt-3">Cancelando…</p>
      }

      <div class="flex justify-end mt-5">
        <button
          mat-stroked-button
          type="button"
          class="!border-rose-500/50 !text-rose-300 cursor-pointer"
          (click)="onCancel()"
          [disabled]="cancelling()"
        >
          <mat-icon style="font-size:18px;width:18px;height:18px;">close</mat-icon>
          Cancelar descarga
        </button>
      </div>
    </div>
  `,
})
export class ZipProgressDialogComponent {
  readonly data = inject<ZipProgressDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ZipProgressDialogComponent, 'cancelled' | undefined>);
  readonly cancelling = signal(false);

  onCancel(): void {
    if (this.cancelling()) return;
    this.cancelling.set(true);
    try {
      this.data.cancel();
    } finally {
      this.dialogRef.close('cancelled');
    }
  }
}
