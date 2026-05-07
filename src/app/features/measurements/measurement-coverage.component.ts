import { Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { BuildingService } from '../../core/services/building.service';
import { MeasurementService } from '../../core/services/measurement.service';
import { CycleService } from '../../core/services/cycle.service';
import { ExportService, ExportColumn } from '../../shared/utils/export.service';
import { NotificationService } from '../../core/services/notification.service';
import { Measurement } from '../../core/models/measurement.model';
import { Apartment } from '../../core/models/building.model';
import { MeasurementDetailDialogComponent } from './measurement-detail-dialog.component';
import { MeasurementCompareDialogComponent, MeasurementCompareDialogData } from './measurement-compare-dialog.component';

type CellStatus = 'verified' | 'pending_review' | 'rejected' | 'missing';

interface AptCell {
  apartment: Apartment;
  tower: string;
  status: CellStatus;
  measurement: Measurement | null;
  count: number;
}

interface MissingRow {
  tower: string;
  apartment: string;
  meter_id: string;
  floor: string;
}

@Component({
  selector: 'app-measurement-coverage',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    @if (!building()) {
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
        <mat-icon class="text-slate-500" style="font-size:36px;width:36px;height:36px;">apartment</mat-icon>
        <p class="text-slate-400 mt-2 text-sm">
          Selecciona un <strong class="text-slate-300">edificio</strong> en los filtros para ver la cobertura.
        </p>
      </div>
    } @else if (!hasPeriod()) {
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
        <mat-icon class="text-slate-500" style="font-size:36px;width:36px;height:36px;">date_range</mat-icon>
        <p class="text-slate-400 mt-2 text-sm">
          Para detectar faltantes selecciona un <strong class="text-slate-300">Mes (captura)</strong>
          o un <strong class="text-slate-300">Ciclo</strong> en los filtros.
        </p>
      </div>
    } @else {
      <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-5">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="space-y-0.5">
            <p class="text-sm font-bold text-white">{{ building()?.name }}</p>
            <p class="text-xs text-slate-400">{{ periodLabel() }}</p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[11px] px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300">
              {{ stats().verified }} validados
            </span>
            <span class="text-[11px] px-2 py-1 rounded-full bg-amber-500/15 text-amber-300">
              {{ stats().pending }} pendientes
            </span>
            <span class="text-[11px] px-2 py-1 rounded-full bg-rose-500/15 text-rose-300">
              {{ stats().rejected }} rechazados
            </span>
            <span class="text-[11px] px-2 py-1 rounded-full bg-slate-700 text-slate-200 font-bold">
              {{ stats().missing }} faltantes
            </span>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Cobertura</span>
            <span class="font-bold text-cyan-300 tabular-nums">
              {{ stats().coveragePct }}% — {{ stats().measured }} / {{ stats().total }}
            </span>
          </div>
          <div class="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div class="h-full bg-cyan-500 transition-[width]" [style.width.%]="stats().coveragePct"></div>
          </div>
        </div>

        @for (tower of towers(); track tower.name) {
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <p class="text-xs font-semibold text-slate-300">{{ tower.name }}</p>
              <span class="text-[10px] text-slate-500">
                ({{ tower.cells.length }} deptos · {{ tower.measured }} medidos · {{ tower.cells.length - tower.measured }} faltan)
              </span>
            </div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-1.5">
              @for (cell of tower.cells; track cell.apartment.id) {
                <button
                  type="button"
                  class="relative px-1 py-2 rounded border text-[12px] font-mono text-center transition-colors cursor-pointer"
                  [class]="cellClasses(cell)"
                  [matTooltip]="cellTooltip(cell)"
                  matTooltipShowDelay="200"
                  (click)="onCellClick(cell)"
                >
                  {{ cell.apartment.number }}
                  @if (cell.count > 1) {
                    <span class="absolute -top-1 -right-1 text-[9px] bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                      {{ cell.count }}
                    </span>
                  }
                </button>
              }
            </div>
          </div>
        }

        <div class="flex items-center justify-between pt-3 border-t border-slate-700/60 flex-wrap gap-3">
          <div class="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50"></span>Validado</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50"></span>Pendiente</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50"></span>Rechazado</span>
            <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-slate-700 border border-slate-600"></span>Sin medición</span>
          </div>
          <button mat-stroked-button class="!border-slate-600 !text-slate-300 cursor-pointer"
                  (click)="exportMissing()"
                  [disabled]="stats().missing === 0">
            <mat-icon>file_download</mat-icon> Exportar faltantes ({{ stats().missing }})
          </button>
        </div>
      </div>
    }
  `,
})
export class MeasurementCoverageComponent {
  readonly filterBuilding = input<string>('');
  readonly filterTower = input<string>('');
  readonly filterCycle = input<string>('');
  readonly filterYear = input<number | ''>('');
  readonly filterMonth = input<number | ''>('');

  private readonly buildingService = inject(BuildingService);
  private readonly measurementService = inject(MeasurementService);
  private readonly cycleService = inject(CycleService);
  private readonly exportService = inject(ExportService);
  private readonly notify = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly building = computed(() => {
    const name = this.filterBuilding();
    if (!name) return null;
    return this.buildingService.buildings().find(b => b.name === name) ?? null;
  });

  readonly hasPeriod = computed(() =>
    !!this.filterCycle() || (this.filterYear() !== '' && this.filterMonth() !== ''),
  );

  readonly periodLabel = computed(() => {
    const cid = this.filterCycle();
    if (cid) {
      const c = this.cycleService.cycles().find(x => x.id === cid);
      return c ? `Ciclo: ${c.name}` : 'Ciclo seleccionado';
    }
    const y = this.filterYear();
    const mo = this.filterMonth();
    if (y !== '' && mo !== '') {
      const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      return `${months[Number(mo) - 1]} ${y}`;
    }
    return '';
  });

  /** Mediciones del edificio (y torre, si está fija) que caen en el período seleccionado. */
  private readonly periodMeasurements = computed<Measurement[]>(() => {
    const b = this.building();
    if (!b || !this.hasPeriod()) return [];
    let ms = this.measurementService.measurements().filter(m => m.building_name === b.name);
    if (this.filterTower()) {
      ms = ms.filter(m => m.tower === this.filterTower());
    }
    const cid = this.filterCycle();
    if (cid) {
      ms = ms.filter(m => String(m.cycle_id ?? '') === cid);
    } else {
      const y = Number(this.filterYear());
      const mo = Number(this.filterMonth());
      ms = ms.filter(m => {
        const d = new Date(m.captured_at);
        return d.getFullYear() === y && d.getMonth() + 1 === mo;
      });
    }
    return ms;
  });

  readonly towers = computed(() => {
    const b = this.building();
    if (!b) return [];
    const wantTower = this.filterTower();
    const ms = this.periodMeasurements();
    return b.towers
      .filter(t => !wantTower || t.name === wantTower)
      .map(t => {
        const cells: AptCell[] = [...t.apartments]
          .sort((a, b) => {
            const an = parseInt(a.number.replace(/\D/g, ''), 10);
            const bn = parseInt(b.number.replace(/\D/g, ''), 10);
            if (Number.isFinite(an) && Number.isFinite(bn) && an !== bn) return an - bn;
            return a.number.localeCompare(b.number);
          })
          .map(apt => {
            const aptMs = ms.filter(m => m.tower === t.name && m.apartment === apt.number);
            const latest = aptMs.length > 0
              ? [...aptMs].sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime())[0]
              : null;
            return {
              apartment: apt,
              tower: t.name,
              status: (latest?.status ?? 'missing') as CellStatus,
              measurement: latest,
              count: aptMs.length,
            };
          });
        const measured = cells.filter(c => c.status !== 'missing').length;
        return { name: t.name, cells, measured };
      });
  });

  readonly stats = computed(() => {
    let verified = 0, pending = 0, rejected = 0, missing = 0, total = 0;
    for (const tower of this.towers()) {
      for (const cell of tower.cells) {
        total++;
        if (cell.status === 'verified') verified++;
        else if (cell.status === 'pending_review') pending++;
        else if (cell.status === 'rejected') rejected++;
        else missing++;
      }
    }
    const measured = total - missing;
    const coveragePct = total > 0 ? Math.round((measured / total) * 100) : 0;
    return { verified, pending, rejected, missing, total, measured, coveragePct };
  });

  cellClasses(cell: AptCell): string {
    if (cell.status === 'verified')
      return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/30';
    if (cell.status === 'pending_review')
      return 'bg-amber-500/15 border-amber-500/40 text-amber-200 hover:bg-amber-500/30';
    if (cell.status === 'rejected')
      return 'bg-rose-500/15 border-rose-500/40 text-rose-200 hover:bg-rose-500/30';
    return 'bg-slate-700/40 border-slate-600 text-slate-400 hover:bg-slate-700';
  }

  cellTooltip(cell: AptCell): string {
    const head = `Depto ${cell.apartment.number} · ${cell.tower}`;
    if (cell.status === 'missing') return `${head} — Sin medición en ${this.periodLabel()}`;
    const labels: Record<string, string> = {
      verified: 'Validado',
      pending_review: 'Pendiente',
      rejected: 'Rechazado',
    };
    const lbl = labels[cell.status] ?? cell.status;
    const more = cell.count > 1 ? ` · ${cell.count} mediciones` : '';
    return `${head} — ${lbl}${more}`;
  }

  onCellClick(cell: AptCell): void {
    if (!cell.measurement) {
      this.notify.info(
        `Sin medición — Depto ${cell.apartment.number} (${cell.tower}) en ${this.periodLabel()}`,
      );
      return;
    }
    // Si hay duplicados en el mismo período, abrir comparación lado a lado.
    if (cell.count > 1) {
      const b = this.building();
      const compareData: MeasurementCompareDialogData = {
        building: b?.name ?? cell.measurement.building_name,
        tower: cell.tower,
        apartment: cell.apartment.number,
        cycleId: this.filterCycle() || null,
        year: this.filterYear() === '' ? null : Number(this.filterYear()),
        month: this.filterMonth() === '' ? null : Number(this.filterMonth()),
        contextLabel: `Depto ${cell.apartment.number} · ${cell.tower} · ${this.periodLabel()}`,
      };
      this.dialog.open(MeasurementCompareDialogComponent, {
        data: compareData,
        panelClass: 'measurement-detail-dialog',
        maxWidth: '1200px',
        width: '96vw',
      });
      return;
    }
    this.dialog.open(MeasurementDetailDialogComponent, {
      data: { measurement: cell.measurement },
      panelClass: 'measurement-detail-dialog',
      maxWidth: '900px',
      width: '96vw',
    });
  }

  exportMissing(): void {
    const missing: MissingRow[] = [];
    for (const tower of this.towers()) {
      for (const cell of tower.cells) {
        if (cell.status === 'missing') {
          missing.push({
            tower: cell.tower,
            apartment: cell.apartment.number,
            meter_id: cell.apartment.meterId,
            floor: String(cell.apartment.floor),
          });
        }
      }
    }
    if (missing.length === 0) {
      this.notify.info('No hay departamentos faltantes en el período');
      return;
    }
    const cols: ExportColumn<MissingRow>[] = [
      { header: 'Torre', key: 'tower', highlight: true, numFmt: '@' },
      { header: 'Depto', key: 'apartment', highlight: true, numFmt: '@' },
      { header: 'Medidor', key: 'meter_id' },
      { header: 'Piso', key: 'floor' },
    ];
    const safe = (this.building()?.name ?? 'edificio').replace(/\s+/g, '_');
    const fileName = this.exportService.buildFileName(`faltantes_${safe}`);
    this.exportService.export(missing, cols, fileName, 'xlsx', 'Faltantes');
    this.notify.success(`${missing.length} departamento(s) faltantes exportados`);
  }
}
