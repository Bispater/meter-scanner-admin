import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Measurement, MeasurementAuditEntry, REJECTION_CATEGORY_LABEL, RejectionCategory } from '../../core/models/measurement.model';
import { MeasurementService } from '../../core/services/measurement.service';
import { AuthService } from '../../core/services/auth.service';
import { ImageLightboxDialogComponent } from './image-lightbox-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { MeasurementEditReadingDialogComponent } from './measurement-edit-reading-dialog.component';
import { MeasurementReassignDialogComponent } from './measurement-reassign-dialog.component';
import { MeasurementRejectDialogComponent, MeasurementRejectResult } from './measurement-reject-dialog.component';
import { formatMeterReadingDisplay } from '../../shared/utils/meter-reading-format';
import { normalizeMeasurementDetailDialogData } from './measurement-detail-dialog.types';

@Component({
  selector: 'app-measurement-detail-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, DatePipe],
  template: `
    <div
      class="flex flex-col bg-slate-800 text-slate-200 min-w-[520px] max-w-[min(920px,96vw)] max-h-[90vh]"
    >
      <!-- Cabecera fija -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-slate-700 shrink-0 gap-3">
        <h2 class="text-lg font-bold text-white shrink-0">Detalle de Medición</h2>
        @if (reviewMode()) {
          <div class="flex items-center gap-0.5 flex-1 justify-center min-w-0">
            <button
              mat-icon-button
              type="button"
              class="!text-slate-300"
              (click)="goPrevReview()"
              [disabled]="loading() || !canPrevReview()"
              matTooltip="Pendiente anterior"
            >
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="text-sm text-slate-400 tabular-nums whitespace-nowrap px-1">
              {{ reviewIndex() + 1 }} / {{ reviewQueue().length }}
            </span>
            <button
              mat-icon-button
              type="button"
              class="!text-slate-300"
              (click)="goNextReview()"
              [disabled]="loading() || !canNextReview()"
              matTooltip="Pendiente siguiente"
            >
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
        <button mat-icon-button type="button" (click)="close($event)" class="cursor-pointer shrink-0">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Cuerpo con scroll -->
      <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div class="px-5 pt-4">
          <div
            class="w-full h-52 sm:h-56 rounded-xl bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-600 cursor-zoom-in relative group"
            (click)="openFullScreen()"
          >
            <img
              [src]="currentData().photo_url"
              alt="Foto del medidor"
              class="w-full h-full object-cover"
              (error)="onImageError($event)"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <mat-icon
                class="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                style="font-size:36px;width:36px;height:36px;"
                >zoom_in</mat-icon
              >
            </div>
          </div>
          @if (currentData().photo_url) {
            <div class="flex justify-end mt-1.5">
              <button
                mat-stroked-button
                type="button"
                class="!border-slate-600 !text-slate-300 cursor-pointer"
                (click)="openFullScreen()"
              >
                <mat-icon>image</mat-icon>
                Ver foto en grande
              </button>
            </div>
          }
        </div>

        <div class="px-5 pb-4 pt-2 space-y-3">
          <div class="grid grid-cols-2 gap-x-4 gap-y-2">
            <div class="col-span-2">
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Edificio (departamento)</p>
              <p class="text-sm font-semibold text-white">{{ currentData().building_name || '—' }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Torre</p>
              <p class="text-sm font-semibold text-white">{{ currentData().tower }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Departamento</p>
              <p class="text-sm font-semibold text-white">{{ currentData().apartment }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-slate-400 mb-1">Ciclo de medición (registro)</p>
              @if (currentData().cycle_id) {
                <p class="text-sm text-white">
                  {{ currentData().cycle_name || 'Ciclo #' + currentData().cycle_id }}
                  @if (currentData().cycle_building_name) {
                    <span class="text-slate-400"> — {{ currentData().cycle_building_name }}</span>
                  }
                </p>
              } @else {
                <p class="text-sm text-slate-500">Sin ciclo asociado (fuera de ventana o histórico)</p>
              }
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">ID Medidor</p>
              <p class="text-sm font-semibold text-white font-mono">{{ currentData().meter_id }}</p>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Tipo</p>
              <p class="text-sm font-semibold text-white">{{ meterTypeLabel }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Cara medidor (lectura)</p>
              <p class="text-sm font-semibold text-white">{{ currentData().reading_layout === 'B' ? 'Tipo B — 5+4 (5 negros + 3 rojos + 1 esfera)' : 'Tipo A — 5 enteros + 4 esferas' }}</p>
            </div>

            <div class="col-span-2">
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Lectura registrada (m³)</p>
              @if (currentData().reading_value != null && currentData().reading_value !== undefined) {
                <p class="text-lg font-bold text-cyan-400 leading-tight">
                  {{ formatMeterReadingDisplayFn(currentData().reading_value, currentData().reading_layout) }} {{ currentData().unit }}
                </p>
              } @else {
                <p class="text-sm text-slate-500">Pendiente (solo foto enviada o IA aún no define valor)</p>
              }
            </div>

            <div class="col-span-2 pt-1 border-t border-slate-700/80">
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Análisis automático (servidor)</p>
              @if (aiAnalysisPending()) {
                <div class="flex items-center gap-3 py-2">
                  <mat-spinner diameter="28"></mat-spinner>
                  <span class="text-sm text-slate-400">Procesando imagen con IA…</span>
                </div>
              } @else if (currentData().ai_analysis_status === 'failed') {
                <p class="text-sm text-amber-400/90">No se pudo obtener una lectura automática. Revise la foto y edite manualmente si hace falta.</p>
              } @else if (currentData().ai_analysis_status === 'skipped') {
                <p class="text-sm text-slate-500">Sin análisis automático (sin foto o omitido).</p>
              } @else if (currentData().ocr_value) {
                <p class="text-sm font-mono text-slate-300">
                  Estimación IA: {{ formatMeterReadingFromOcrDigits(currentData().ocr_value ?? '', currentData().reading_layout) }}
                </p>
                @if (currentData().ai_agrees_with_operator === true) {
                  <p class="text-xs text-emerald-400 mt-1">Coincide con la lectura del operador.</p>
                } @else if (currentData().ai_agrees_with_operator === false) {
                  <p class="text-xs text-amber-400/90 mt-1">
                    No coincide con la lectura del operador: prevalece la del operador; revise la imagen.
                  </p>
                }
              } @else {
                <p class="text-sm text-slate-500">—</p>
              }
            </div>

            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Estado</p>
              <span
                class="text-xs font-medium px-2.5 py-1 rounded-full"
                [class]="
                  currentData().status === 'verified'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : currentData().status === 'pending_review'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-red-500/15 text-red-400'
                "
              >
                {{ statusLabel }}
              </span>
            </div>
            <div>
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Fecha / Hora captura</p>
              <p class="text-sm font-semibold text-white">{{ currentData().captured_at | date: 'dd/MM/yyyy HH:mm:ss' }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Operador</p>
              <p class="text-sm font-semibold text-white">{{ currentData().operator_name || currentData().operator_id || '—' }}</p>
            </div>
          </div>

          @if (currentData().location_coords && (currentData().location_coords.lat || currentData().location_coords.lng)) {
            <div class="pt-2 border-t border-slate-700">
              <p class="text-[11px] uppercase tracking-wide text-slate-500 mb-0.5">Coordenadas</p>
              <p class="text-sm text-slate-300 font-mono">
                {{ currentData().location_coords.lat }}, {{ currentData().location_coords.lng }}
              </p>
            </div>
          }

          @if (currentData().status === 'verified' && currentData().validated_by_name) {
            <div class="pt-2 border-t border-slate-700">
              <div class="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
                <mat-icon class="text-emerald-400 shrink-0" style="font-size:18px;width:18px;height:18px;margin-top:1px">verified</mat-icon>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-emerald-300 m-0">Validada</p>
                  <p class="text-[11px] text-slate-400 m-0">
                    Por <strong class="text-slate-200">{{ currentData().validated_by_name }}</strong>
                    @if (currentData().validated_at) {
                      · {{ currentData().validated_at | date: 'dd/MM/yyyy HH:mm' }}
                    }
                  </p>
                </div>
              </div>
            </div>
          }

          @if (currentData().status === 'rejected' && currentData().rejected_by_name) {
            <div class="pt-2 border-t border-slate-700">
              <div class="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                <mat-icon class="text-red-400 shrink-0" style="font-size:18px;width:18px;height:18px;margin-top:1px">block</mat-icon>
                <div class="min-w-0 flex-1">
                  <p class="text-xs font-semibold text-red-300 m-0">
                    Rechazada
                    @if (currentData().rejection_category) {
                      <span class="text-slate-400 font-normal">— {{ rejectionCategoryLabel(currentData().rejection_category) }}</span>
                    }
                  </p>
                  <p class="text-[11px] text-slate-400 m-0">
                    Por <strong class="text-slate-200">{{ currentData().rejected_by_name }}</strong>
                    @if (currentData().rejected_at) {
                      · {{ currentData().rejected_at | date: 'dd/MM/yyyy HH:mm' }}
                    }
                  </p>
                  @if (currentData().rejection_reason) {
                    <p class="text-[11px] text-slate-300 mt-1 m-0 italic">"{{ currentData().rejection_reason }}"</p>
                  }
                </div>
              </div>
            </div>
          }

          @if (currentData().audit_logs?.length) {
            <div class="pt-2 border-t border-slate-700">
              <p class="text-xs font-semibold text-slate-300 mb-1.5">Historial de cambios (administración)</p>
              <ul class="space-y-2 max-h-40 overflow-y-auto text-xs pr-1">
                @for (log of currentData().audit_logs!; track log.id) {
                  <li class="bg-slate-900/80 rounded-lg p-2 border border-slate-700/80">
                    <span class="text-slate-500">{{ log.created_at | date: 'dd/MM/yyyy HH:mm' }}</span>
                    @if (log.edited_by_name) {
                      <span class="text-slate-400"> — {{ log.edited_by_name }}</span>
                    }
                    <div class="text-slate-200 mt-1">
                      <strong>{{ fieldLabel(log.field_name) }}:</strong>
                      {{ formatAuditTransition(log) }}
                    </div>
                    @if (log.note) {
                      <div class="text-slate-500 mt-0.5">Nota: {{ log.note }}</div>
                    }
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      </div>

      <!-- Pie fijo: Eliminar a la izquierda; acciones de flujo + editar + cerrar a la derecha -->
      <div class="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-700 shrink-0 bg-slate-800">
        <button
          mat-flat-button
          type="button"
          class="!bg-red-600/80 !text-white cursor-pointer shrink-0"
          (click)="onDelete()"
          [disabled]="loading()"
        >
          <mat-icon>delete</mat-icon> Eliminar
        </button>
        <div class="flex gap-2 items-center flex-wrap justify-end min-w-0">
          @if (isAdmin() && currentData().status !== 'verified') {
            <button
              mat-stroked-button
              type="button"
              class="!border-cyan-500/40 !text-cyan-300 cursor-pointer"
              (click)="openEditReading()"
              [disabled]="loading()"
            >
              <mat-icon style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
              Editar lectura
            </button>
          } @else if (isAdmin() && currentData().status === 'verified') {
            <button
              mat-stroked-button
              type="button"
              class="!border-slate-600 !text-slate-500 cursor-not-allowed"
              [disabled]="true"
              matTooltip="Reabre la medición antes de corregir la lectura"
            >
              <mat-icon style="font-size:18px;width:18px;height:18px;">edit_off</mat-icon>
              Editar lectura
            </button>
          }
          @if (isAdmin()) {
            <button
              mat-stroked-button
              type="button"
              class="!border-cyan-500/40 !text-cyan-300 cursor-pointer"
              (click)="openReassign()"
              [disabled]="loading()"
              matTooltip="Mover esta medición a otro depto (la foto y lectura se conservan)"
            >
              <mat-icon style="font-size:18px;width:18px;height:18px;">swap_horiz</mat-icon>
              Reasignar
            </button>
          }
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
            <button mat-stroked-button type="button" (click)="close($event)" class="!border-slate-600 !text-slate-300 cursor-pointer">
              Cerrar
            </button>
        </div>
      </div>
    </div>
  `,
})
export class MeasurementDetailDialogComponent implements OnInit {
  readonly formatMeterReadingDisplayFn = formatMeterReadingDisplay;

  readonly dialogRef = inject(MatDialogRef<MeasurementDetailDialogComponent>);
  private readonly payload = normalizeMeasurementDetailDialogData(inject(MAT_DIALOG_DATA));
  private readonly measurementService = inject(MeasurementService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  /** Cola de revisión (solo pendientes); vacío si no es modo álbum. */
  readonly reviewQueue = signal<Measurement[]>([...(this.payload.reviewQueue ?? [])]);
  readonly reviewIndex = signal(0);
  readonly reviewMode = computed(() => this.reviewQueue().length > 0);
  readonly canPrevReview = computed(() => this.reviewIndex() > 0);
  readonly canNextReview = computed(() => this.reviewIndex() < this.reviewQueue().length - 1);

  readonly currentData = signal<Measurement>(this.payload.measurement);
  readonly loading = signal(false);

  /** Hubo validación, rechazo, edición de lectura o borrado que afecta la lista. */
  private dirty = false;

  isAdmin = this.authService.isAdmin;

  ngOnInit(): void {
    const q = this.reviewQueue();
    const startId = this.payload.measurement.id;
    let idx = q.findIndex(m => m.id === startId);
    if (idx < 0) idx = 0;
    this.reviewIndex.set(idx);
    const idToLoad = q.length > 0 ? q[idx].id : startId;
    void this.loadDetail(idToLoad);
  }

  private async loadDetail(id: string): Promise<void> {
    this.loading.set(true);
    const m = await this.measurementService.fetchDetail(id);
    this.loading.set(false);
    if (m) {
      this.currentData.set(m);
    }
  }

  goPrevReview(): void {
    const i = this.reviewIndex();
    if (i <= 0) return;
    const newI = i - 1;
    this.reviewIndex.set(newI);
    void this.loadDetail(this.reviewQueue()[newI].id);
  }

  goNextReview(): void {
    const i = this.reviewIndex();
    const q = this.reviewQueue();
    if (i >= q.length - 1) return;
    const newI = i + 1;
    this.reviewIndex.set(newI);
    void this.loadDetail(q[newI].id);
  }

  openEditReading(): void {
    if (this.currentData().status === 'verified') return;
    const ref = this.dialog.open(MeasurementEditReadingDialogComponent, {
      data: { measurement: this.currentData() },
      panelClass: ['dark-dialog', 'measurement-edit-nested'],
      maxWidth: '560px',
      width: '96vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe(async (updated: Measurement | undefined) => {
      if (!updated) return;
      this.dirty = true;
      // Re-leer el detalle: el PATCH no siempre devuelve `audit_logs` ni los datos
      // derivados (validador, etc.); el GET /:id/ es la fuente autoritativa.
      await this.loadDetail(updated.id);
    });
  }

  openReassign(): void {
    const ref = this.dialog.open(MeasurementReassignDialogComponent, {
      data: { measurement: this.currentData() },
      panelClass: ['dark-dialog', 'measurement-edit-nested'],
      maxWidth: '640px',
      width: '96vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe(async (updated: Measurement | undefined) => {
      if (!updated) return;
      this.dirty = true;
      // Recargar para que el historial muestre la nueva entrada apartment.
      await this.loadDetail(updated.id);
    });
  }

  /** Texto legible para el historial (sin slugs API ni números crudos sueltos). */
  formatAuditTransition(log: MeasurementAuditEntry): string {
    const left = this.formatAuditFieldValue(log.field_name, log.old_value);
    const right = this.formatAuditFieldValue(log.field_name, log.new_value);
    return `${left} → ${right}`;
  }

  private formatAuditFieldValue(fieldName: string, raw: string): string {
    if (raw === null || raw === undefined || String(raw).trim() === '') return '—';
    if (fieldName === 'status') return this.statusLabelFromApi(raw);
    if (fieldName === 'reading_value') {
      const layout = this.currentData().reading_layout;
      const unit = this.currentData().unit || 'm³';
      return `${formatMeterReadingDisplay(raw, layout)} ${unit}`;
    }
    return raw;
  }

  private statusLabelFromApi(status: string): string {
    const map: Record<string, string> = {
      verified: 'Validado',
      pending_review: 'Pendiente',
      rejected: 'Rechazado',
    };
    return map[status] ?? status;
  }

  fieldLabel(field: string): string {
    const map: Record<string, string> = {
      reading_value: 'Lectura',
      status: 'Estado',
    };
    return map[field] || field;
  }

  close(event: Event): void {
    event.stopPropagation();
    this.dialogRef.close(this.dirty ? 'updated' : undefined);
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

  aiAnalysisPending(): boolean {
    const s = this.currentData().ai_analysis_status;
    return s === 'pending' || s === 'processing';
  }

  formatMeterReadingFromOcrDigits(ocr: string, layout?: 'A' | 'B'): string {
    const digits = (ocr || '').replace(/\D/g, '');
    if (!digits) return '—';
    return formatMeterReadingDisplay(digits, layout);
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
    const cur = this.currentData();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      data: {
        title: 'Validar medición',
        message: `¿Validar la medición del medidor ${cur.meter_id}? Quedará registrado tu nombre como validador.`,
        confirmText: 'Validar',
        type: 'info',
      },
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      this.loading.set(true);
      const updated = await this.measurementService.validateMeasurement(cur.id);
      this.loading.set(false);
      if (!updated) return;
      this._applyTransition(updated, true);
    });
  }

  onReject(): void {
    const cur = this.currentData();
    const ref = this.dialog.open(MeasurementRejectDialogComponent, {
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      maxWidth: '95vw',
      data: { meterId: cur.meter_id, apartmentNumber: cur.apartment },
    });
    ref.afterClosed().subscribe(async (result: MeasurementRejectResult | undefined) => {
      if (!result) return;
      this.loading.set(true);
      const updated = await this.measurementService.rejectMeasurement(cur.id, result.category, result.reason);
      this.loading.set(false);
      if (!updated) return;
      this._applyTransition(updated, true);
    });
  }

  onReopen(): void {
    const cur = this.currentData();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      data: {
        title: 'Reabrir medición',
        message: '¿Deseas cambiar esta medición a "Pendiente"? Podrás validarla o rechazarla nuevamente.',
        confirmText: 'Reabrir',
        type: 'warning',
      },
    });
    ref.afterClosed().subscribe(async confirmed => {
      if (!confirmed) return;
      this.loading.set(true);
      const updated = await this.measurementService.updateMeasurementStatus(cur.id, 'pending_review');
      this.loading.set(false);
      if (!updated) return;
      this._applyTransition(updated, false);
    });
  }

  private _applyTransition(updated: Measurement, leavesPendingQueue: boolean): void {
    this.dirty = true;
    if (this.reviewMode() && leavesPendingQueue) {
      this.advanceQueueAfterRemoval(updated.id);
    } else {
      this.currentData.set(updated);
    }
  }

  rejectionCategoryLabel(cat: string | null | undefined): string {
    if (!cat) return '';
    return REJECTION_CATEGORY_LABEL[cat as RejectionCategory] ?? cat;
  }

  /** Tras validar/rechazar en modo cola: quita la fila actual y muestra la siguiente pendiente. */
  private advanceQueueAfterRemoval(removedId: string): void {
    const q = this.reviewQueue().filter(m => m.id !== removedId);
    this.reviewQueue.set(q);
    if (q.length === 0) {
      this.dialogRef.close('updated');
      return;
    }
    const idx = Math.min(this.reviewIndex(), q.length - 1);
    this.reviewIndex.set(idx);
    void this.loadDetail(q[idx].id);
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
      const curId = this.currentData().id;
      const q = this.reviewQueue();
      this.measurementService.deleteMeasurement(curId);
      this.dirty = true;
      if (this.reviewMode()) {
        const newQ = q.filter(m => m.id !== curId);
        this.reviewQueue.set(newQ);
        if (newQ.length === 0) {
          this.dialogRef.close('updated');
          return;
        }
        const idx = Math.min(this.reviewIndex(), newQ.length - 1);
        this.reviewIndex.set(idx);
        void this.loadDetail(newQ[idx].id);
        return;
      }
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

}
