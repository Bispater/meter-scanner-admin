import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Measurement } from '../../core/models/measurement.model';
import { MeasurementService } from '../../core/services/measurement.service';
import { ImageLightboxDialogComponent } from './image-lightbox-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-measurement-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, DatePipe],
  template: `
    <div class="bg-slate-800 text-slate-200 min-w-[520px]">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h2 class="text-lg font-bold text-white">Detalle de Medición</h2>
        <button mat-icon-button (click)="close($event)" class="cursor-pointer">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Photo -->
      <div class="px-6 pt-5">
        <div class="w-full h-72 rounded-xl bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-600 cursor-zoom-in relative group"
             (click)="openFullScreen()">
          <img [src]="currentData().photo_url" alt="Foto del medidor" class="w-full h-full object-cover"
            (error)="onImageError($event)" />
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <mat-icon class="text-white opacity-0 group-hover:opacity-100 transition-opacity" style="font-size:36px;width:36px;height:36px;">zoom_in</mat-icon>
          </div>
        </div>
        @if (currentData().photo_url) {
          <div class="flex justify-end mt-2">
            <button mat-stroked-button class="!border-slate-600 !text-slate-300 cursor-pointer" (click)="openFullScreen()">
              <mat-icon>image</mat-icon>
              Ver foto en grande
            </button>
          </div>
        }
      </div>

      <!-- Details Grid -->
      <div class="px-6 py-5 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-slate-400 mb-1">ID Medidor</p>
            <p class="text-sm font-semibold text-white font-mono">{{ currentData().meter_id }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Tipo</p>
            <p class="text-sm font-semibold text-white">{{ meterTypeLabel }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Torre</p>
            <p class="text-sm font-semibold text-white">{{ currentData().tower }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Departamento</p>
            <p class="text-sm font-semibold text-white">{{ currentData().apartment }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Lectura</p>
            <p class="text-xl font-bold text-cyan-400">{{ formatMeterReading(currentData().reading_value) }} {{ currentData().unit }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Estado</p>
            <span class="text-xs font-medium px-2.5 py-1 rounded-full"
              [class]="currentData().status === 'verified' ? 'bg-emerald-500/15 text-emerald-400' :
                       currentData().status === 'pending_review' ? 'bg-amber-500/15 text-amber-400' :
                       'bg-red-500/15 text-red-400'">
              {{ statusLabel }}
            </span>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Fecha / Hora</p>
            <p class="text-sm font-semibold text-white">{{ currentData().captured_at | date:'dd/MM/yyyy HH:mm:ss' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Operador</p>
            <p class="text-sm font-semibold text-white">{{ currentData().operator_id || '—' }}</p>
          </div>
        </div>

        @if (currentData().location_coords) {
          <div class="pt-2 border-t border-slate-700">
            <p class="text-xs text-slate-400 mb-1">Coordenadas</p>
            <p class="text-sm text-slate-300 font-mono">
              {{ currentData().location_coords.lat }}, {{ currentData().location_coords.lng }}
            </p>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-slate-700">
        <button mat-flat-button class="!bg-red-600/80 !text-white cursor-pointer" (click)="onDelete()" [disabled]="loading()">
          <mat-icon>delete</mat-icon> Eliminar
        </button>
        <div class="flex gap-2 items-center">
          @if (currentData().status === 'pending_review') {
            <button mat-flat-button class="!bg-emerald-600 !text-white cursor-pointer" (click)="onValidate()" [disabled]="loading()">
              <mat-icon>check</mat-icon> Validar
            </button>
            <button mat-flat-button class="!bg-red-600 !text-white cursor-pointer" (click)="onReject()" [disabled]="loading()">
              <mat-icon>close</mat-icon> Rechazar
            </button>
          }
          @if (currentData().status === 'verified') {
            <button mat-stroked-button class="!border-red-500/50 !text-red-400 cursor-pointer" (click)="onReject()" [disabled]="loading()">
              <mat-icon>close</mat-icon> Rechazar
            </button>
            <button mat-stroked-button class="!border-amber-500/50 !text-amber-400 cursor-pointer" (click)="onReopen()" [disabled]="loading()">
              <mat-icon>replay</mat-icon> Reabrir
            </button>
          }
          @if (currentData().status === 'rejected') {
            <button mat-flat-button class="!bg-emerald-600 !text-white cursor-pointer" (click)="onValidate()" [disabled]="loading()">
              <mat-icon>check</mat-icon> Validar
            </button>
            <button mat-stroked-button class="!border-amber-500/50 !text-amber-400 cursor-pointer" (click)="onReopen()" [disabled]="loading()">
              <mat-icon>replay</mat-icon> Reabrir
            </button>
          }
          <button mat-stroked-button (click)="close($event)" class="!border-slate-600 !text-slate-300 cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  `,
})
export class MeasurementDetailDialogComponent {
  readonly dialogRef = inject(MatDialogRef<MeasurementDetailDialogComponent>);
  private readonly initialData: Measurement = inject(MAT_DIALOG_DATA);
  private readonly measurementService = inject(MeasurementService);
  private readonly dialog = inject(MatDialog);

  readonly currentData = signal<Measurement>(this.initialData);
  readonly loading = signal(false);

  close(event: Event): void {
    event.stopPropagation();
    const changed = this.currentData().status !== this.initialData.status;
    this.dialogRef.close(changed ? 'updated' : undefined);
  }

  openFullScreen(): void {
    const d = this.currentData();
    if (!d.photo_url) return;
    this.dialog.open(ImageLightboxDialogComponent, {
      data: { photoUrl: d.photo_url, alt: `Medidor ${d.meter_id}` },
      panelClass: 'lightbox-dialog',
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100vw',
      height: '100vh',
    });
  }

  get statusLabel(): string {
    const map: Record<string, string> = {
      verified: 'Validado',
      pending_review: 'Pendiente',
      rejected: 'Rechazado',
    };
    return map[this.currentData().status] || this.currentData().status;
  }

  get meterTypeLabel(): string {
    const map: Record<string, string> = {
      analog: 'Analógico',
      digital_drum: 'Digital (Tambor)',
      digital: 'Digital',
    };
    return map[this.currentData().meter_type] || this.currentData().meter_type;
  }

  onValidate(): void {
    this._confirmAndChangeStatus(
      'verified',
      'Validar medición',
      `¿Estás seguro de que deseas validar esta medición del medidor ${this.currentData().meter_id}?`,
      { confirmText: 'Validar', type: 'info' },
    );
  }

  onReject(): void {
    this._confirmAndChangeStatus(
      'rejected',
      'Rechazar medición',
      `¿Estás seguro de que deseas rechazar esta medición del medidor ${this.currentData().meter_id}?`,
      { confirmText: 'Rechazar', type: 'danger' },
    );
  }

  onReopen(): void {
    this._confirmAndChangeStatus(
      'pending_review',
      'Reabrir medición',
      `¿Deseas cambiar esta medición a "Pendiente"? Podrás validarla o rechazarla nuevamente.`,
      { confirmText: 'Reabrir', type: 'warning' },
    );
  }

  private _confirmAndChangeStatus(
    newStatus: string,
    title: string,
    message: string,
    opts: { confirmText: string; type: 'danger' | 'warning' | 'info' },
  ): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      data: { title, message, confirmText: opts.confirmText, type: opts.type },
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      this.loading.set(true);
      const updated = await this.measurementService.updateMeasurementStatus(this.currentData().id, newStatus);
      this.loading.set(false);
      if (updated) {
        this.currentData.set(updated);
      }
    });
  }

  onDelete(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      data: {
        title: 'Eliminar medición',
        message: `¿Estás seguro de que deseas eliminar la medición #${this.currentData().id} del medidor ${this.currentData().meter_id}? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        type: 'danger',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.measurementService.deleteMeasurement(this.currentData().id);
      this.dialogRef.close('deleted');
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    img.parentElement!.innerHTML = `
      <div class="flex flex-col items-center justify-center h-full text-slate-500">
        <span class="material-icons" style="font-size:48px">hide_image</span>
        <span class="text-sm mt-2">Sin foto</span>
      </div>
    `;
  }

  formatMeterReading(raw: number | string): string {
    const integerDigits = String(raw).split('.')[0].replace(/\D/g, '');
    if (!integerDigits) return String(raw);
    const right = integerDigits.slice(-4).padStart(4, '0');
    const left = integerDigits.slice(0, -4).padStart(5, '0');
    return `${left},${right}`;
  }
}
