import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Measurement } from '../../core/models/measurement.model';
import { MeasurementService } from '../../core/services/measurement.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MeasurementDetailDialogComponent } from './measurement-detail-dialog.component';
import { ImageLightboxDialogComponent } from './image-lightbox-dialog.component';
import { MeasurementReassignDialogComponent } from './measurement-reassign-dialog.component';
import { formatMeterReadingDisplay } from '../../shared/utils/meter-reading-format';

export interface MeasurementCompareDialogData {
  building: string;
  tower: string;
  apartment: string;
  /** Si está presente, se usa cycle_id; si no, se usan year/month. */
  cycleId?: string | null;
  year?: number | null;
  month?: number | null;
  /** Texto descriptivo, p. ej. "Depto 304 · Torre A · Mayo 2026". */
  contextLabel: string;
}

const STATUS_LABELS: Record<Measurement['status'], string> = {
  verified: 'Validado',
  pending_review: 'Pendiente',
  rejected: 'Rechazado',
};

@Component({
  selector: 'app-measurement-compare-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, DatePipe],
  template: `
    <div class="bg-slate-800 text-slate-200 max-w-[1200px] w-[96vw] max-h-[92vh] flex flex-col">
      <div class="flex items-center justify-between px-5 py-3 border-b border-slate-700 shrink-0 gap-3">
        <div class="min-w-0">
          <h2 class="text-lg font-bold text-white truncate">Comparar duplicados</h2>
          <p class="text-xs text-slate-400 truncate">
            {{ data.contextLabel }} — <strong class="text-slate-300">{{ items().length }}</strong> medición{{ items().length === 1 ? '' : 'es' }}
          </p>
        </div>
        <button mat-icon-button type="button" (click)="close()" class="cursor-pointer shrink-0">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto p-4">
        @if (items().length === 0) {
          <div class="text-center py-12 text-slate-500">
            <mat-icon style="font-size:36px;width:36px;height:36px;">inbox</mat-icon>
            <p class="mt-2 text-sm">Ya no quedan mediciones para este depto en el período.</p>
          </div>
        } @else {
          <div class="grid gap-4" [style.grid-template-columns]="gridTemplate()">
            @for (m of items(); track m.id) {
              <div class="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden flex flex-col"
                   [class]="m.status === 'verified' ? 'ring-1 ring-emerald-500/40' : ''">
                <!-- Photo -->
                <div class="relative w-full h-56 bg-slate-700 cursor-zoom-in group"
                     (click)="openLightbox(m)">
                  @if (m.photo_url) {
                    <img [src]="m.photo_url" [alt]="'Medición #' + m.id" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <mat-icon class="text-white opacity-0 group-hover:opacity-100" style="font-size:30px;width:30px;height:30px;">zoom_in</mat-icon>
                    </div>
                  } @else {
                    <div class="w-full h-full flex items-center justify-center text-slate-500 text-sm">Sin foto</div>
                  }
                  @if (isMostRecent(m)) {
                    <span class="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/85 text-slate-900 font-bold uppercase tracking-wide shadow">
                      Más reciente
                    </span>
                  }
                  @if (isHighestReading(m)) {
                    <span class="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-fuchsia-500/85 text-white font-bold uppercase tracking-wide shadow">
                      Lectura mayor
                    </span>
                  }
                </div>

                <!-- Info -->
                <div class="p-4 space-y-3 flex-1">
                  <div>
                    <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Lectura registrada</p>
                    <p class="text-2xl font-bold text-cyan-300 font-mono leading-tight">
                      {{ formatReading(m) }}
                      <span class="text-xs text-slate-500 font-normal">m³</span>
                    </p>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p class="text-[10px] uppercase text-slate-500">Capturada</p>
                      <p class="text-slate-300">{{ m.captured_at | date:'dd/MM/yy HH:mm' }}</p>
                    </div>
                    <div>
                      <p class="text-[10px] uppercase text-slate-500">Estado</p>
                      <span class="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block"
                            [class]="m.status === 'verified' ? 'bg-emerald-500/15 text-emerald-300' :
                                     m.status === 'pending_review' ? 'bg-amber-500/15 text-amber-300' :
                                     'bg-rose-500/15 text-rose-300'">
                        {{ statusLabel(m.status) }}
                      </span>
                    </div>
                    <div class="col-span-2">
                      <p class="text-[10px] uppercase text-slate-500">Operador</p>
                      <p class="text-slate-300">{{ m.operator_name || '—' }}</p>
                    </div>
                    @if (m.ocr_value) {
                      <div class="col-span-2">
                        <p class="text-[10px] uppercase text-slate-500">Estimación IA</p>
                        <p class="text-slate-400 font-mono text-xs">{{ formatOcr(m) }}</p>
                        @if (m.ai_agrees_with_operator === false) {
                          <p class="text-[10px] text-amber-400/80 mt-0.5">No coincide con operador</p>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="px-3 pb-3 flex flex-wrap gap-1.5 border-t border-slate-800 pt-3">
                  @if (m.status === 'pending_review') {
                    <button mat-flat-button class="!bg-emerald-600 !text-white !text-xs grow"
                            (click)="validate(m)" [disabled]="busy()">
                      <mat-icon style="font-size:16px;width:16px;height:16px;">check</mat-icon> Validar
                    </button>
                  }
                  <button mat-stroked-button class="!border-cyan-500/40 !text-cyan-300 !text-xs grow"
                          (click)="reassign(m)" [disabled]="busy()"
                          matTooltip="Mover esta medición a otro depto (la foto y lectura se conservan)">
                    <mat-icon style="font-size:16px;width:16px;height:16px;">swap_horiz</mat-icon> Reasignar
                  </button>
                  <button mat-stroked-button class="!border-slate-600 !text-slate-300 !text-xs grow"
                          (click)="openDetail(m)" [disabled]="busy()"
                          matTooltip="Ver detalle completo (con historial y editar)">
                    <mat-icon style="font-size:16px;width:16px;height:16px;">open_in_new</mat-icon> Detalle
                  </button>
                  <button mat-stroked-button class="!border-rose-500/40 !text-rose-300 !text-xs grow"
                          (click)="deleteOne(m)" [disabled]="busy()"
                          matTooltip="Mover esta medición a la papelera (recuperable 30 días)">
                    <mat-icon style="font-size:16px;width:16px;height:16px;">delete</mat-icon> Eliminar
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="px-5 py-3 border-t border-slate-700 flex items-center justify-between shrink-0 gap-2">
        <p class="text-[11px] text-slate-500">
          Tip: la lectura mayor suele ser la correcta cuando son del mismo período. Verifica con la foto.
        </p>
        <button mat-stroked-button class="!border-slate-600 !text-slate-300 cursor-pointer" (click)="close()">
          Cerrar
        </button>
      </div>
    </div>
  `,
})
export class MeasurementCompareDialogComponent {
  readonly data = inject<MeasurementCompareDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MeasurementCompareDialogComponent>);
  private readonly measurementService = inject(MeasurementService);
  private readonly dialog = inject(MatDialog);

  readonly busy = signal(false);

  /** Lista en vivo: el signal del servicio se actualiza tras validar/eliminar y este computed reacciona. */
  readonly items = computed(() => {
    const all = this.measurementService.measurements();
    return all
      .filter(m =>
        m.building_name === this.data.building &&
        m.tower === this.data.tower &&
        m.apartment === this.data.apartment &&
        this._matchesPeriod(m),
      )
      .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
  });

  gridTemplate(): string {
    const n = Math.min(this.items().length, 3);
    return `repeat(${Math.max(n, 1)}, minmax(0, 1fr))`;
  }

  isMostRecent(m: Measurement): boolean {
    const list = this.items();
    if (list.length < 2) return false;
    return list[0]?.id === m.id;
  }

  isHighestReading(m: Measurement): boolean {
    const list = this.items();
    if (list.length < 2 || m.reading_value == null) return false;
    const max = list.reduce((mx, x) => Math.max(mx, x.reading_value ?? -Infinity), -Infinity);
    return m.reading_value === max && Number.isFinite(max);
  }

  formatReading(m: Measurement): string {
    return formatMeterReadingDisplay(m.reading_value, m.reading_layout);
  }

  formatOcr(m: Measurement): string {
    const digits = (m.ocr_value || '').replace(/\D/g, '');
    if (!digits) return '—';
    return formatMeterReadingDisplay(digits, m.reading_layout);
  }

  statusLabel(s: Measurement['status']): string {
    return STATUS_LABELS[s] ?? s;
  }

  openLightbox(m: Measurement): void {
    if (!m.photo_url) return;
    this.dialog.open(ImageLightboxDialogComponent, {
      data: { photoUrl: m.photo_url, alt: `Medidor ${m.meter_id}` },
      panelClass: 'lightbox-dialog',
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100vw',
      height: '100vh',
    });
  }

  openDetail(m: Measurement): void {
    this.dialog.open(MeasurementDetailDialogComponent, {
      data: { measurement: m },
      panelClass: 'measurement-detail-dialog',
      maxWidth: '900px',
      width: '96vw',
    });
  }

  validate(m: Measurement): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      data: {
        title: 'Validar medición',
        message: `¿Validar la medición #${m.id} (lectura ${this.formatReading(m)} m³)?`,
        confirmText: 'Validar',
        type: 'info',
      },
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      this.busy.set(true);
      await this.measurementService.validateMeasurement(m.id);
      this.busy.set(false);
    });
  }

  reassign(m: Measurement): void {
    this.dialog.open(MeasurementReassignDialogComponent, {
      data: { measurement: m },
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      maxWidth: '640px',
      width: '96vw',
      autoFocus: false,
      restoreFocus: false,
    });
    // El service actualiza el signal global; este compare-dialog usa computed
    // sobre measurements() y reaccionará solo (la fila reasignada deja de matchear
    // building+tower+apartment de este modal).
  }

  deleteOne(m: Measurement): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      data: {
        title: 'Enviar a la papelera',
        message:
          `¿Eliminar la medición #${m.id} (lectura ${this.formatReading(m)} m³)? ` +
          'Quedará en la papelera 30 días y podrás restaurarla.',
        confirmText: 'Enviar a papelera',
        type: 'danger',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.measurementService.deleteMeasurement(m.id);
    });
  }

  close(): void {
    this.dialogRef.close('done');
  }

  private _matchesPeriod(m: Measurement): boolean {
    if (this.data.cycleId) {
      return String(m.cycle_id ?? '') === String(this.data.cycleId);
    }
    if (this.data.year != null && this.data.month != null) {
      const d = new Date(m.captured_at);
      return d.getFullYear() === this.data.year && d.getMonth() + 1 === this.data.month;
    }
    return true;
  }
}
