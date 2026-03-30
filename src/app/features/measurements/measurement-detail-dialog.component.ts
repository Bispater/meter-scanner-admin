import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Measurement } from '../../core/models/measurement.model';

@Component({
  selector: 'app-measurement-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, DatePipe],
  template: `
    <div class="bg-slate-800 text-slate-200 min-w-[520px]">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h2 class="text-lg font-bold text-white">Detalle de Medición</h2>
        <button mat-icon-button (click)="dialogRef.close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Photo -->
      <div class="px-6 pt-5">
        <div class="w-full h-56 rounded-xl bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-600">
          <img [src]="data.photo_url" alt="Foto del medidor" class="w-full h-full object-cover"
            (error)="onImageError($event)" />
        </div>
      </div>

      <!-- Details Grid -->
      <div class="px-6 py-5 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-slate-400 mb-1">ID Medidor</p>
            <p class="text-sm font-semibold text-white font-mono">{{ data.meter_id }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Tipo</p>
            <p class="text-sm font-semibold text-white">{{ meterTypeLabel }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Torre</p>
            <p class="text-sm font-semibold text-white">{{ data.tower }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Departamento</p>
            <p class="text-sm font-semibold text-white">{{ data.apartment }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Lectura</p>
            <p class="text-xl font-bold text-cyan-400">{{ data.reading_value }} {{ data.unit }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Estado</p>
            <span class="text-xs font-medium px-2.5 py-1 rounded-full"
              [class]="data.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400' :
                       data.status === 'pending_review' ? 'bg-amber-500/15 text-amber-400' :
                       'bg-red-500/15 text-red-400'">
              {{ statusLabel }}
            </span>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Fecha / Hora</p>
            <p class="text-sm font-semibold text-white">{{ data.captured_at | date:'dd/MM/yyyy HH:mm:ss' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Operador</p>
            <p class="text-sm font-semibold text-white">{{ data.operator_id }}</p>
          </div>
        </div>

        @if (data.location_coords) {
          <div class="pt-2 border-t border-slate-700">
            <p class="text-xs text-slate-400 mb-1">Coordenadas</p>
            <p class="text-sm text-slate-300 font-mono">
              {{ data.location_coords.lat }}, {{ data.location_coords.lng }}
            </p>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
        @if (data.status === 'pending_review') {
          <button mat-flat-button class="!bg-emerald-600 !text-white">
            <mat-icon>check</mat-icon> Validar
          </button>
          <button mat-flat-button class="!bg-red-600 !text-white">
            <mat-icon>close</mat-icon> Rechazar
          </button>
        }
        <button mat-stroked-button (click)="dialogRef.close()" class="!border-slate-600 !text-slate-300">
          Cerrar
        </button>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface { background: transparent !important; }
  `],
})
export class MeasurementDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MeasurementDetailDialogComponent>);
  readonly data: Measurement = inject(MAT_DIALOG_DATA);

  get statusLabel(): string {
    const map: Record<string, string> = {
      verified: 'Validado',
      pending_review: 'Pendiente',
      rejected: 'Rechazado',
    };
    return map[this.data.status] || this.data.status;
  }

  get meterTypeLabel(): string {
    const map: Record<string, string> = {
      analog: 'Analógico',
      digital_drum: 'Digital (Tambor)',
      digital: 'Digital',
    };
    return map[this.data.meter_type] || this.data.meter_type;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://via.placeholder.com/400x250/1e293b/64748b?text=Sin+Foto';
  }
}
