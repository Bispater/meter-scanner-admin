import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Measurement } from '../../core/models/measurement.model';
import { LoadScope, MeasurementService } from '../../core/services/measurement.service';
import { CycleService } from '../../core/services/cycle.service';
import { BuildingService } from '../../core/services/building.service';
import { NotificationService } from '../../core/services/notification.service';
import { ExportService, ExportFormat } from '../../shared/utils/export.service';
import { MeasurementPhotoExportService, ZIP_CANCELLED } from '../../shared/utils/measurement-photo-export.service';
import {
  measurementSheetColumns,
  slugForFileName,
  sortMeasurementsForSheet,
} from '../../shared/utils/measurement-export.util';
import {
  buildPeriodOptions,
  parsePeriodKey,
  periodKey,
  periodLabel,
  SPANISH_MONTHS,
} from '../../shared/utils/period-options.util';
import { ZipProgressDialogComponent } from './zip-progress-dialog.component';

export interface MeasurementExportDialogData {
  /** Filas visibles en la tabla al abrir (opcional): habilita la opción «lo que ves». */
  visibleRows?: Measurement[];
  /** Etiqueta de esa opción, p. ej. «Tabla actual» o «Papelera». */
  visibleLabel?: string;
  /** Ciclo preseleccionado (si la tabla ya estaba filtrada por uno). */
  cycleId?: string;
  /** Período `YYYY-MM` preseleccionado (si la tabla ya estaba en un mes). */
  period?: string;
}

type ExportSource = 'cycle' | 'month' | 'visible';
type StatusFilter = '' | 'verified';

/**
 * Exportación independiente de la tabla: la clienta elige un ciclo o un mes
 * (y opcionalmente edificio / solo validadas), ve cuántas lecturas hay y
 * descarga la planilla, el CSV o el ZIP de fotos. Los datos se piden al
 * servidor aquí mismo, sin pisar lo que muestra la tabla de Mediciones.
 */
@Component({
  selector: 'app-measurement-export-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="bg-slate-800 text-slate-200 w-full">
      <div class="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-slate-700">
        <div class="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center shrink-0">
          <mat-icon class="text-cyan-400">download</mat-icon>
        </div>
        <div class="min-w-0">
          <h2 class="text-lg font-bold text-white m-0">Exportar mediciones</h2>
          <p class="text-xs text-slate-500 m-0">
            Elige qué exportar y el formato. No depende de lo que muestra la tabla.
          </p>
        </div>
      </div>

      <div class="px-5 py-4 space-y-4">
        <!-- Fuente -->
        <div>
          <p class="text-xs font-semibold text-slate-300 mb-2">¿Qué exportar?</p>
          <div class="grid gap-2" [class]="sourceOptions().length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'">
            @for (opt of sourceOptions(); track opt.value) {
              <button type="button"
                      class="flex items-start gap-2.5 text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer"
                      [class]="source() === opt.value
                          ? 'bg-cyan-500/10 border-cyan-500/60 text-white'
                          : 'bg-slate-700/40 border-slate-600 text-slate-300 hover:border-slate-500'"
                      (click)="setSource(opt.value)">
                <mat-icon style="font-size:18px;width:18px;height:18px;margin-top:2px"
                          [class]="source() === opt.value ? 'text-cyan-400' : 'text-slate-500'">
                  {{ opt.icon }}
                </mat-icon>
                <div class="min-w-0">
                  <p class="text-sm font-semibold m-0">{{ opt.label }}</p>
                  <p class="text-[11px] text-slate-500 m-0">{{ opt.description }}</p>
                </div>
              </button>
            }
          </div>
        </div>

        <!-- Selección según fuente -->
        @if (source() === 'cycle') {
          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Ciclo</mat-label>
            <mat-select [(ngModel)]="cycleId" (ngModelChange)="refresh()">
              @for (c of cycles(); track c.id) {
                <mat-option [value]="c.id">
                  {{ c.name }} · {{ c.building_name }} · {{ c.month_name }} {{ c.year }}
                  ({{ c.measured_count }}/{{ c.total_apartments }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
          @if (cycles().length === 0) {
            <p class="text-xs text-amber-300/90 -mt-2">No hay ciclos creados. Exporta por mes.</p>
          }
        } @else if (source() === 'month') {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <mat-form-field appearance="outline" class="dense-field w-full">
              <mat-label>Mes de captura</mat-label>
              <mat-select [(ngModel)]="period" (ngModelChange)="refresh()">
                @for (p of periodOptions(); track p.value) {
                  <mat-option [value]="p.value">{{ p.label }}{{ p.value === currentPeriod ? ' · actual' : '' }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="dense-field w-full">
              <mat-label>Edificio</mat-label>
              <mat-select [ngModel]="building()" (ngModelChange)="building.set($event)">
                <mat-option value="">Todos</mat-option>
                @for (b of buildings(); track b) {
                  <mat-option [value]="b">{{ b }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        }

        <mat-form-field appearance="outline" class="dense-field w-full sm:w-64">
          <mat-label>Lecturas a incluir</mat-label>
          <mat-select [ngModel]="status()" (ngModelChange)="status.set($event)">
            <mat-option value="">Todas (validadas, pendientes y rechazadas)</mat-option>
            <mat-option value="verified">Solo validadas</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Resumen de lo que se va a exportar -->
        <div class="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2.5 flex items-center gap-3 text-sm min-h-[44px]">
          @if (busy()) {
            <mat-spinner diameter="18" strokeWidth="2"></mat-spinner>
            <span class="text-slate-400">Buscando mediciones…</span>
          } @else if (error()) {
            <mat-icon class="text-rose-400" style="font-size:18px;width:18px;height:18px;">error_outline</mat-icon>
            <span class="text-rose-300">No se pudieron cargar las mediciones. Intenta de nuevo.</span>
          } @else if (rows().length === 0) {
            <mat-icon class="text-slate-500" style="font-size:18px;width:18px;height:18px;">search_off</mat-icon>
            <span class="text-slate-400">No hay mediciones para {{ scopeLabel() }}.</span>
          } @else {
            <mat-icon class="text-emerald-400" style="font-size:18px;width:18px;height:18px;">check_circle</mat-icon>
            <span class="text-slate-300">
              <strong class="text-white">{{ rows().length }}</strong>
              {{ rows().length === 1 ? 'lectura' : 'lecturas' }} ·
              <strong class="text-white">{{ photoCount() }}</strong> con foto ·
              {{ scopeLabel() }}
            </span>
          }
        </div>

        <p class="text-[11px] text-slate-500 m-0 leading-relaxed">
          La planilla tiene dos columnas, <span class="text-slate-400">Depto-Torre</span> y
          <span class="text-slate-400">Lectura</span>, ordenadas por torre y departamento.
          El ZIP agrupa las fotos en carpetas Edificio/Torre.
        </p>
      </div>

      <div class="flex flex-wrap justify-end gap-2 px-5 pb-5 pt-2">
        <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cancelar</button>
        <button mat-stroked-button
                class="!border-slate-600 !text-slate-300 cursor-pointer"
                [disabled]="!canExport() || photoCount() === 0 || zipBusy()"
                matTooltip="El ZIP se arma en el servidor; incluye solo las lecturas con foto"
                (click)="exportZip()">
          <mat-icon [class.animate-spin]="zipBusy()">{{ zipBusy() ? 'progress_activity' : 'archive' }}</mat-icon>
          Fotos (ZIP)
        </button>
        <button mat-stroked-button
                class="!border-slate-600 !text-slate-300 cursor-pointer"
                [disabled]="!canExport()"
                (click)="exportSheet('csv')">
          <mat-icon>description</mat-icon> CSV
        </button>
        <button mat-flat-button
                [disabled]="!canExport()"
                [class]="canExport() ? '!bg-cyan-600 !text-white cursor-pointer' : '!bg-slate-700 !text-slate-500'"
                (click)="exportSheet('xlsx')">
          <mat-icon>grid_on</mat-icon> Planilla XLSX
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::ng-deep .dense-field .mat-mdc-form-field-infix {
      padding-top: 8px !important;
      padding-bottom: 8px !important;
      min-height: 40px !important;
    }
    ::ng-deep .dense-field .mat-mdc-text-field-wrapper { height: 48px !important; }
    ::ng-deep .dense-field .mat-mdc-form-field-flex { height: 48px !important; align-items: center !important; }
    ::ng-deep .dense-field .mat-mdc-form-field-subscript-wrapper { display: none !important; }
  `],
})
export class MeasurementExportDialogComponent implements OnInit {
  readonly data = inject<MeasurementExportDialogData>(MAT_DIALOG_DATA, { optional: true }) ?? {};
  private readonly dialogRef = inject(MatDialogRef<MeasurementExportDialogComponent, 'exported' | undefined>);
  private readonly dialog = inject(MatDialog);
  private readonly measurementService = inject(MeasurementService);
  private readonly cycleService = inject(CycleService);
  private readonly buildingService = inject(BuildingService);
  private readonly notify = inject(NotificationService);
  private readonly exportService = inject(ExportService);
  private readonly photoExport = inject(MeasurementPhotoExportService);

  readonly currentPeriod = periodKey(new Date().getFullYear(), new Date().getMonth() + 1);

  readonly source = signal<ExportSource>('cycle');
  cycleId = '';
  period = this.currentPeriod;
  readonly building = signal('');
  readonly status = signal<StatusFilter>('');

  /** Filas traídas del servidor (o las visibles de la tabla) antes de los filtros locales. */
  private readonly _fetched = signal<Measurement[]>([]);
  readonly busy = signal(false);
  readonly error = signal(false);
  readonly zipBusy = signal(false);
  /** Secuencia para ignorar respuestas de una selección anterior. */
  private _reqSeq = 0;

  readonly cycles = computed(() =>
    [...this.cycleService.cycles()].sort((a, b) => (b.year - a.year) || (b.month - a.month)),
  );
  readonly buildings = computed(() =>
    this.buildingService.buildings().map(b => b.name).sort((a, b) => a.localeCompare(b)),
  );
  readonly periodOptions = computed(() => buildPeriodOptions(this.cycleService.cycles()));

  readonly sourceOptions = computed(() => {
    const opts: { value: ExportSource; label: string; description: string; icon: string }[] = [
      { value: 'cycle', label: 'Un ciclo', description: 'Edificio y período de un ciclo de lectura.', icon: 'event_repeat' },
      { value: 'month', label: 'Un mes', description: 'Todas las capturas de un mes calendario.', icon: 'calendar_month' },
    ];
    const visible = this.data.visibleRows ?? [];
    if (visible.length > 0) {
      opts.push({
        value: 'visible',
        label: this.data.visibleLabel ?? 'Tabla actual',
        description: `Las ${visible.length} filas que muestra la tabla ahora.`,
        icon: 'table_rows',
      });
    }
    return opts;
  });

  /** Filas finales tras edificio y estado. */
  readonly rows = computed(() => {
    let r = this._fetched();
    const b = this.building();
    if (b && this.source() === 'month') {
      const q = b.toLowerCase();
      r = r.filter(m => (m.building_name ?? '').toLowerCase() === q);
    }
    const st = this.status();
    if (st) r = r.filter(m => m.status === st);
    return r;
  });
  readonly photoCount = computed(() => this.rows().filter(m => !!m.photo_url?.trim()).length);
  readonly canExport = computed(() => !this.busy() && !this.error() && this.rows().length > 0);

  /** Etiqueta humana de lo seleccionado («Lord Cochrane · Septiembre 2026»). */
  readonly scopeLabel = computed(() => {
    switch (this.source()) {
      case 'cycle': {
        const c = this.cycles().find(x => x.id === this.cycleId);
        return c ? `${c.name} · ${c.building_name}` : 'el ciclo seleccionado';
      }
      case 'month': {
        const p = parsePeriodKey(this.period);
        const base = p ? periodLabel(p.year, p.month) : 'el mes seleccionado';
        const b = this.building();
        return b ? `${base} · ${b}` : base;
      }
      case 'visible':
        return this.data.visibleLabel ?? 'la tabla actual';
    }
  });

  ngOnInit(): void {
    const cycles = this.cycles();
    if (this.data.cycleId && cycles.some(c => c.id === this.data.cycleId)) {
      this.source.set('cycle');
      this.cycleId = this.data.cycleId;
    } else if (this.data.period && parsePeriodKey(this.data.period)) {
      this.source.set('month');
      this.period = this.data.period;
      this.cycleId = this._defaultCycleId();
    } else if (cycles.length > 0) {
      this.source.set('cycle');
      this.cycleId = this._defaultCycleId();
    } else {
      this.source.set('month');
    }
    this.refresh();
  }

  setSource(src: ExportSource): void {
    if (this.source() === src) return;
    this.source.set(src);
    if (src === 'cycle' && !this.cycleId) this.cycleId = this._defaultCycleId();
    this.refresh();
  }

  /** Vuelve a pedir las filas al servidor según la fuente elegida. */
  refresh(): void {
    const seq = ++this._reqSeq;
    this.error.set(false);
    const src = this.source();

    if (src === 'visible') {
      this._fetched.set(this.data.visibleRows ?? []);
      this.busy.set(false);
      return;
    }

    let scope: NonNullable<LoadScope>;
    if (src === 'cycle') {
      if (!this.cycleId) { this._fetched.set([]); this.busy.set(false); return; }
      scope = { kind: 'cycle', cycleId: this.cycleId };
    } else {
      const p = parsePeriodKey(this.period);
      if (!p) { this._fetched.set([]); this.busy.set(false); return; }
      scope = { kind: 'month', year: p.year, month: p.month };
    }

    this.busy.set(true);
    this.measurementService.fetchByScope(scope).then(
      rows => {
        if (seq !== this._reqSeq) return;
        this._fetched.set(rows);
        this.busy.set(false);
      },
      err => {
        if (seq !== this._reqSeq) return;
        console.error('[EXPORT] fetch error:', err);
        this._fetched.set([]);
        this.error.set(true);
        this.busy.set(false);
      },
    );
  }

  exportSheet(format: ExportFormat): void {
    if (!this.canExport()) return;
    const rows = sortMeasurementsForSheet(this.rows());
    const fileName = this.exportService.buildFileName(`mediciones_${slugForFileName(this.scopeLabel())}`);
    this.exportService.export(rows, measurementSheetColumns(), fileName, format, 'Mediciones');
    this.notify.success(`${rows.length} ${rows.length === 1 ? 'lectura exportada' : 'lecturas exportadas'} (${format.toUpperCase()})`);
    this.dialogRef.close('exported');
  }

  async exportZip(): Promise<void> {
    if (this.zipBusy() || !this.canExport()) return;
    const ids = this.photoExport.collectIds(this.rows());
    if (ids.length === 0) {
      this.notify.info('No hay lecturas con foto en la selección.');
      return;
    }
    this.zipBusy.set(true);
    const handle = this.photoExport.buildZipFromIds(ids, this._zipPeriodLabel());
    const progressRef = this.dialog.open(ZipProgressDialogComponent, {
      data: { count: ids.length, cancel: () => handle.cancel() },
      panelClass: 'dark-dialog',
      disableClose: true,
      autoFocus: false,
      restoreFocus: false,
    });
    try {
      const { blob, included, skipped } = await handle.result;
      progressRef.close();
      const name = this.exportService.buildFileName(`fotos_${slugForFileName(this.scopeLabel())}`);
      this.photoExport.triggerDownload(blob, `${name}.zip`);
      const extra = skipped > 0 ? ` · ${skipped} sin archivo en disco` : '';
      this.notify.success(`${included} foto(s) en el ZIP${extra}`);
      this.dialogRef.close('exported');
    } catch (e: unknown) {
      progressRef.close();
      if (e === ZIP_CANCELLED) {
        this.notify.info('Descarga cancelada');
      } else {
        const msg = e instanceof Error ? e.message : 'No se pudieron empaquetar las fotos';
        this.notify.error(msg);
      }
    } finally {
      this.zipBusy.set(false);
    }
  }

  /** Ciclo más reciente con lecturas; si ninguno tiene, el más reciente. */
  private _defaultCycleId(): string {
    const cycles = this.cycles();
    return (cycles.find(c => c.measured_count > 0) ?? cycles[0])?.id ?? '';
  }

  /**
   * Etiqueta de carpeta raíz del ZIP: nombre del ciclo o «2026 Septiembre»
   * (misma convención que usa el backend cuando infiere el período).
   */
  private _zipPeriodLabel(): string {
    if (this.source() === 'cycle') {
      return this.cycles().find(c => c.id === this.cycleId)?.name ?? '';
    }
    if (this.source() === 'month') {
      const p = parsePeriodKey(this.period);
      if (p) return `${p.year} ${SPANISH_MONTHS[p.month - 1]}`;
    }
    return '';
  }
}
