import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CycleService } from '../../core/services/cycle.service';
import { BuildingService } from '../../core/services/building.service';
import { MeasurementService } from '../../core/services/measurement.service';
import { MeasurementCycle, CycleProgressApartment, CycleProgressResponse } from '../../core/models/cycle.model';

/* ─────────────────────────────────────────
   Main Cycles Component
───────────────────────────────────────── */
@Component({
  selector: 'app-cycles',
  standalone: true,
  imports: [DatePipe, FormsModule, MatButtonModule, MatIconModule, MatDialogModule, MatTooltipModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Ciclos de Medición</h2>
          <p class="text-slate-400 text-sm mt-1">Gestión de períodos mensuales de lectura de medidores</p>
        </div>
        <button mat-flat-button class="!bg-cyan-600 !text-white cursor-pointer" (click)="openCreate()">
          <mat-icon>add</mat-icon> Nuevo Ciclo
        </button>
      </div>

      <!-- Info banner -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
          <mat-icon style="font-size:18px;width:18px;height:18px;" class="text-cyan-400">info</mat-icon>
        </div>
        <div>
          <p class="text-sm font-semibold text-white">Ciclos con departamentos asignados</p>
          <p class="text-xs text-slate-400 mt-1">
            Cada ciclo puede tener departamentos específicos asignados. Si no se asigna ninguno, se consideran todos los del edificio.
            Los ciclos con <strong class="text-amber-400">bloqueo activo</strong>
            <mat-icon class="text-amber-400" style="font-size:12px;width:12px;height:12px;vertical-align:middle;">lock</mat-icon>
            solo permitirán mediciones mientras estén "En Curso".
          </p>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p class="text-2xl font-bold text-white">{{ cycleService.cycles().length }}</p>
          <p class="text-xs text-slate-400 mt-0.5">Total ciclos</p>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p class="text-2xl font-bold text-cyan-400">{{ activeCycles().length }}</p>
          <p class="text-xs text-slate-400 mt-0.5">Activos / Pendientes</p>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p class="text-2xl font-bold text-emerald-400">{{ completedCycles().length }}</p>
          <p class="text-xs text-slate-400 mt-0.5">Completados</p>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p class="text-2xl font-bold text-slate-300">{{ closedCycles().length }}</p>
          <p class="text-xs text-slate-400 mt-0.5">Cerrados</p>
        </div>
      </div>

      <!-- Cycles list -->
      <div class="space-y-3">
        @for (cycle of cycleService.cycles(); track cycle.id) {
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-slate-600 transition-colors">
            <div class="flex items-start justify-between gap-4">
              <!-- Left: info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="text-base font-bold text-white">{{ cycle.name }}</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium" [class]="statusClass(cycle.status)">
                    {{ statusLabel(cycle.status) }}
                  </span>
                  @if (cycle.enforce) {
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-400 flex items-center gap-1">
                      <mat-icon style="font-size:11px;width:11px;height:11px;">lock</mat-icon> Bloqueo activo
                    </span>
                  }
                  @if (cycle.apartment_ids && cycle.apartment_ids.length > 0) {
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-violet-500/15 text-violet-400">
                      {{ cycle.apartment_ids.length }} dptos asignados
                    </span>
                  } @else {
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-500/15 text-slate-400">
                      Todos los dptos
                    </span>
                  }
                </div>
                <p class="text-sm text-slate-400 mt-0.5">
                  {{ cycle.building_name }} ·
                  Programado: {{ cycle.scheduled_date | date:'dd/MM/yyyy' }} ·
                  Límite: {{ cycle.deadline | date:'dd/MM/yyyy' }}
                </p>

                <!-- Progress bar -->
                <div class="mt-3">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs text-slate-400">Progreso</span>
                    <span class="text-xs font-semibold"
                          [class]="cycle.progress_pct === 100 ? 'text-emerald-400' : 'text-slate-300'">
                      {{ cycle.measured_count }} / {{ cycle.total_apartments }}
                      ({{ cycle.progress_pct }}%)
                    </span>
                  </div>
                  <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500"
                         [class]="cycle.progress_pct === 100 ? 'bg-emerald-500' : 'bg-cyan-500'"
                         [style.width.%]="cycle.progress_pct">
                    </div>
                  </div>
                  <p class="text-xs text-slate-500 mt-1">
                    {{ cycle.pending_count }} departamento{{ cycle.pending_count !== 1 ? 's' : '' }} pendiente{{ cycle.pending_count !== 1 ? 's' : '' }}
                  </p>
                </div>
              </div>

              <!-- Right: actions -->
              <div class="flex flex-col gap-2 shrink-0 items-end">
                <button mat-stroked-button class="!border-slate-600 !text-slate-300 text-xs cursor-pointer"
                        (click)="openProgress(cycle)">
                  <mat-icon style="font-size:16px;width:16px;height:16px;">visibility</mat-icon>
                  Ver Progreso
                </button>
                <mat-select class="text-xs !bg-slate-700 rounded px-2 py-1 cursor-pointer"
                            [value]="cycle.status"
                            (valueChange)="onStatusChange(cycle, $event)"
                            style="font-size:12px">
                  <mat-option value="pending">Pendiente</mat-option>
                  <mat-option value="in_progress">En Curso</mat-option>
                  <mat-option value="completed">Completado</mat-option>
                  <mat-option value="closed">Cerrado</mat-option>
                </mat-select>
                <div class="flex items-center gap-3 mt-2 px-3 py-2 rounded-lg cursor-pointer"
                     [class]="cycle.enforce ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-700/40 border border-slate-600/30'"
                     matTooltip="Bloquear mediciones fuera de este ciclo">
                  <mat-icon style="font-size:15px;width:15px;height:15px;"
                            [class]="cycle.enforce ? 'text-amber-400' : 'text-slate-500'">lock</mat-icon>
                  <span class="text-[10px] leading-tight"
                        [class]="cycle.enforce ? 'text-amber-300' : 'text-slate-500'">
                    {{ cycle.enforce ? 'Bloqueo activo' : 'Sin bloqueo' }}
                  </span>
                  <mat-slide-toggle [checked]="cycle.enforce" (change)="toggleEnforce(cycle, $event)" color="warn" class="ml-auto" />
                </div>
              </div>
            </div>
          </div>
        }

        @if (cycleService.cycles().length === 0) {
          <div class="py-16 text-center bg-slate-800 rounded-xl border border-slate-700">
            <mat-icon class="text-slate-600" style="font-size:48px;width:48px;height:48px;">event_note</mat-icon>
            <p class="text-slate-400 mt-3">No hay ciclos creados aún.</p>
            <button mat-flat-button class="!bg-cyan-600 !text-white mt-4" (click)="openCreate()">
              Crear primer ciclo
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class CyclesComponent implements OnInit {
  readonly cycleService = inject(CycleService);
  private readonly dialog = inject(MatDialog);

  readonly activeCycles = computed(() =>
    this.cycleService.cycles().filter(c => c.status === 'pending' || c.status === 'in_progress')
  );
  readonly completedCycles = computed(() =>
    this.cycleService.cycles().filter(c => c.status === 'completed')
  );
  readonly closedCycles = computed(() =>
    this.cycleService.cycles().filter(c => c.status === 'closed')
  );

  ngOnInit(): void {
    this.cycleService.loadAll();
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente', in_progress: 'En Curso',
      completed: 'Completado', closed: 'Cerrado',
    };
    return map[s] ?? s;
  }

  statusClass(s: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/15 text-amber-400',
      in_progress: 'bg-cyan-500/15 text-cyan-400',
      completed: 'bg-emerald-500/15 text-emerald-400',
      closed: 'bg-slate-500/15 text-slate-400',
    };
    return map[s] ?? 'bg-slate-500/15 text-slate-400';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStatusChange(cycle: MeasurementCycle, newStatus: any): void {
    const s = newStatus as string;
    if (s !== cycle.status) {
      this.cycleService.updateCycleStatus(cycle.id, s);
    }
  }

  openCreate(): void {
    const ref = this.dialog.open(CreateCycleDialogComponent, {
      width: '540px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'dark-dialog',
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.cycleService.createCycle(result);
    });
  }

  toggleEnforce(cycle: MeasurementCycle, event: any): void {
    const newVal = event.checked as boolean;
    event.source.checked = cycle.enforce;

    const ref = this.dialog.open(ConfirmEnforcementDialogComponent, {
      width: '440px',
      panelClass: 'dark-dialog',
      data: { enabling: newVal, cycleName: cycle.name },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.cycleService.updateCycle(cycle.id, { enforce: newVal });
      }
    });
  }

  openProgress(cycle: MeasurementCycle): void {
    this.dialog.open(CycleProgressDialogComponent, {
      width: '95vw',
      maxWidth: '1100px',
      maxHeight: '90vh',
      panelClass: 'dark-dialog',
      data: { cycle },
    });
  }
}

/* ─────────────────────────────────────────
   Create Cycle Dialog
───────────────────────────────────────── */
@Component({
  selector: 'app-create-cycle-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatSlideToggleModule,
    MatDatepickerModule, MatNativeDateModule, MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-white">Nuevo Ciclo de Medición</h2>
    <mat-dialog-content class="!pt-3">
      <div class="flex gap-6" [class]="showAptPanel() ? '' : 'max-w-[520px]'">
        <!-- Left column: form -->
        <div class="space-y-4 shrink-0" [style.width]="showAptPanel() ? '380px' : '100%'">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre del Ciclo</mat-label>
            <input matInput [(ngModel)]="form.name" placeholder="Ej: Abril 2026 — Pisos 1 al 5" />
          </mat-form-field>

          <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Edificio</mat-label>
              <mat-select [(ngModel)]="form.building" (ngModelChange)="onBuildingChange()">
                @for (b of buildings(); track b.id) {
                  <mat-option [value]="toNumber(b.id)">{{ b.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Estado inicial</mat-label>
              <mat-select [(ngModel)]="form.status">
                <mat-option value="pending">Pendiente</mat-option>
                <mat-option value="in_progress">En Curso</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Año</mat-label>
              <input matInput type="number" [(ngModel)]="form.year" min="2020" max="2099" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Mes</mat-label>
              <mat-select [(ngModel)]="form.month">
                @for (m of months; track m.value) {
                  <mat-option [value]="m.value">{{ m.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline">
              <mat-label>Fecha Programada</mat-label>
              <input matInput [matDatepicker]="scheduledPicker" [(ngModel)]="scheduledDate"
                     (dateChange)="onScheduledChange()" readonly />
              <mat-datepicker-toggle matIconSuffix [for]="scheduledPicker"></mat-datepicker-toggle>
              <mat-datepicker #scheduledPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha Límite</mat-label>
              <input matInput [matDatepicker]="deadlinePicker" [(ngModel)]="deadlineDate"
                     [min]="scheduledDate" (dateChange)="onDeadlineChange()" readonly />
              <mat-datepicker-toggle matIconSuffix [for]="deadlinePicker"></mat-datepicker-toggle>
              <mat-datepicker #deadlinePicker></mat-datepicker>
            </mat-form-field>
          </div>

          @if (dateError) {
            <p class="text-xs text-red-400 flex items-center gap-1 -mt-2">
              <mat-icon style="font-size:14px;width:14px;height:14px;">error</mat-icon>
              {{ dateError }}
            </p>
          }

          <!-- Enforce toggle -->
          <div class="rounded-lg p-3 flex items-center justify-between gap-4"
               [class]="form.enforce ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-700/30 border border-slate-700'">
            <div class="min-w-0">
              <p class="text-sm text-white font-medium flex items-center gap-2">
                <mat-icon style="font-size:16px;width:16px;height:16px;"
                          [class]="form.enforce ? 'text-amber-400' : 'text-slate-500'">lock</mat-icon>
                Bloquear mediciones
              </p>
              <p class="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Solo se podrán medir estos departamentos mientras el ciclo esté "En Curso".
              </p>
            </div>
            <mat-slide-toggle [(ngModel)]="form.enforce" color="warn" />
          </div>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Notas (opcional)</mat-label>
            <textarea matInput [(ngModel)]="form.notes" rows="2"></textarea>
          </mat-form-field>
        </div>

        <!-- Right column: apartment picker -->
        @if (showAptPanel()) {
          <div class="flex-1 min-w-0 border-l border-slate-700 pl-5">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-white">Departamentos del ciclo</h3>
              <div class="flex gap-1.5">
                <button type="button"
                        class="text-[10px] px-2.5 py-1 rounded-md border transition-colors cursor-pointer"
                        [class]="selectedAptIds.length === 0 ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'"
                        (click)="selectedAptIds = []; lastClickedAptId = null">
                  Todos
                </button>
                <button type="button"
                        class="text-[10px] px-2.5 py-1 rounded-md border bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500 transition-colors cursor-pointer"
                        (click)="selectAll()">
                  Sel. todos
                </button>
              </div>
            </div>

            <!-- Status + legend -->
            <div class="flex items-center justify-between mb-3">
              <p class="text-[10px] text-slate-500">
                @if (selectedAptIds.length === 0) {
                  Sin selección = <strong class="text-slate-300">todos participan</strong>
                } @else {
                  <strong class="text-violet-400">{{ selectedAptIds.length }}</strong> seleccionados
                }
              </p>
              <div class="flex gap-3 text-[9px]">
                <span class="flex items-center gap-1">
                  <span class="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500/50"></span>
                  <span class="text-slate-500">Incluido (todos)</span>
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2.5 h-2.5 rounded-sm bg-violet-500/30 border border-violet-500"></span>
                  <span class="text-slate-500">Seleccionado</span>
                </span>
                <span class="flex items-center gap-1">
                  <span class="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-600"></span>
                  <span class="text-slate-500">Excluido</span>
                </span>
              </div>
            </div>

            <p class="text-[9px] text-slate-600 mb-3 flex items-center gap-1">
              <mat-icon style="font-size:11px;width:11px;height:11px;">keyboard</mat-icon>
              Shift + Click para seleccionar un rango
            </p>

            <div class="overflow-y-auto space-y-3" style="max-height:calc(70vh - 200px)">
              @for (tower of selectedBuilding()!.towers; track tower.id) {
                <div class="bg-slate-800/50 rounded-lg p-3">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-xs text-white font-semibold">{{ tower.name }}</span>
                    <span class="text-[9px] text-slate-500">({{ tower.apartments.length }})</span>
                    <div class="ml-auto flex gap-1">
                      <button type="button" class="text-[9px] px-2 py-0.5 rounded border border-slate-600 text-slate-400 hover:border-violet-400 hover:text-violet-400 transition-colors cursor-pointer"
                              (click)="selectTower(tower)">+ Torre</button>
                      <button type="button" class="text-[9px] px-2 py-0.5 rounded border border-slate-700 text-slate-500 hover:border-red-400 hover:text-red-400 transition-colors cursor-pointer"
                              (click)="deselectTower(tower)">− Torre</button>
                    </div>
                  </div>
                  <div class="grid gap-[3px]" style="grid-template-columns:repeat(auto-fill, minmax(48px, 1fr))">
                    @for (apt of tower.apartments; track apt.id) {
                      <button type="button"
                              class="text-[10px] h-[26px] leading-[26px] rounded border transition-all cursor-pointer text-center truncate px-1"
                              [class]="isAptSelected(apt.id) ? 'bg-violet-500/25 border-violet-500 text-violet-300 font-medium' : selectedAptIds.length === 0 ? 'bg-cyan-500/8 border-cyan-500/25 text-cyan-400/50' : 'bg-slate-800 border-slate-600 text-slate-500 hover:border-slate-500'"
                              (click)="onAptClick($event, apt.id)">{{ apt.number }}</button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cancelar</button>
      <button mat-flat-button
              [disabled]="!isValid()"
              [class]="isValid() ? '!bg-cyan-600 !text-white cursor-pointer' : '!bg-slate-700 !text-slate-500'"
              (click)="submit()">
        <mat-icon>add</mat-icon> Crear Ciclo
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateCycleDialogComponent {
  private readonly buildingService = inject(BuildingService);
  private readonly dialogRef = inject(MatDialogRef<CreateCycleDialogComponent>);
  readonly buildings = this.buildingService.buildings;

  readonly months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  scheduledDate: Date | null = null;
  deadlineDate: Date | null = null;
  dateError = '';
  selectedAptIds: number[] = [];
  lastClickedAptId: number | null = null;
  flatAptIds: number[] = [];

  form = {
    name: '',
    building: null as number | null,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    scheduled_date: '',
    deadline: '',
    status: 'pending',
    enforce: false,
    notes: '',
  };

  toNumber(val: any): number { return Number(val); }

  showAptPanel(): boolean {
    return this.form.building != null && this.selectedBuilding() != null;
  }

  selectedBuilding() {
    if (this.form.building == null) return null;
    return this.buildings().find(b => Number(b.id) === this.form.building) ?? null;
  }

  onBuildingChange(): void {
    this.selectedAptIds = [];
    this.lastClickedAptId = null;
    const b = this.selectedBuilding();
    this.flatAptIds = b ? b.towers.flatMap(t => t.apartments.map(a => Number(a.id))) : [];
    this._resizeDialog();
  }

  private _resizeDialog(): void {
    if (this.showAptPanel()) {
      this.dialogRef.updateSize('95vw');
    } else {
      this.dialogRef.updateSize('540px');
    }
  }

  isAptSelected(id: string): boolean {
    return this.selectedAptIds.includes(Number(id));
  }

  onAptClick(event: MouseEvent, id: string): void {
    const numId = Number(id);
    if (event.shiftKey && this.lastClickedAptId != null) {
      const startIdx = this.flatAptIds.indexOf(this.lastClickedAptId);
      const endIdx = this.flatAptIds.indexOf(numId);
      if (startIdx !== -1 && endIdx !== -1) {
        const from = Math.min(startIdx, endIdx);
        const to = Math.max(startIdx, endIdx);
        const rangeIds = this.flatAptIds.slice(from, to + 1);
        const shouldSelect = !this.selectedAptIds.includes(numId);
        if (shouldSelect) {
          const toAdd = rangeIds.filter(rid => !this.selectedAptIds.includes(rid));
          this.selectedAptIds = [...this.selectedAptIds, ...toAdd];
        } else {
          const removeSet = new Set(rangeIds);
          this.selectedAptIds = this.selectedAptIds.filter(sid => !removeSet.has(sid));
        }
        this.lastClickedAptId = numId;
        return;
      }
    }
    if (this.selectedAptIds.includes(numId)) {
      this.selectedAptIds = this.selectedAptIds.filter(i => i !== numId);
    } else {
      this.selectedAptIds = [...this.selectedAptIds, numId];
    }
    this.lastClickedAptId = numId;
  }

  selectTower(tower: any): void {
    const ids = tower.apartments.map((a: any) => Number(a.id));
    const toAdd = ids.filter((id: number) => !this.selectedAptIds.includes(id));
    this.selectedAptIds = [...this.selectedAptIds, ...toAdd];
  }

  deselectTower(tower: any): void {
    const ids = new Set(tower.apartments.map((a: any) => Number(a.id)));
    this.selectedAptIds = this.selectedAptIds.filter(id => !ids.has(id));
  }

  selectAll(): void {
    this.selectedAptIds = [...this.flatAptIds];
  }

  onScheduledChange(): void {
    if (this.scheduledDate) {
      this.form.scheduled_date = this._formatDate(this.scheduledDate);
      if (this.deadlineDate && this.deadlineDate < this.scheduledDate) {
        this.deadlineDate = null;
        this.form.deadline = '';
      }
    }
    this._validateDates();
  }

  onDeadlineChange(): void {
    if (this.deadlineDate) {
      this.form.deadline = this._formatDate(this.deadlineDate);
    }
    this._validateDates();
  }

  private _validateDates(): void {
    if (this.scheduledDate && this.deadlineDate) {
      if (this.deadlineDate < this.scheduledDate) {
        this.dateError = 'La fecha límite no puede ser anterior a la fecha programada.';
        return;
      }
    }
    this.dateError = '';
  }

  private _formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  isValid(): boolean {
    return !!(this.form.name && this.form.building != null && this.form.year && this.form.month
      && this.form.scheduled_date && this.form.deadline && !this.dateError);
  }

  submit(): void {
    if (this.isValid()) {
      this.dialogRef.close({
        ...this.form,
        apartment_ids: this.selectedAptIds,
      });
    }
  }
}

/* ─────────────────────────────────────────
   Cycle Progress Dialog
───────────────────────────────────────── */
@Component({
  selector: 'app-cycle-progress-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule],
  template: `
    <div class="bg-slate-800 text-slate-200">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            {{ cycle?.name }}
            <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                  [class]="cycle?.progress_pct === 100 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-cyan-500/15 text-cyan-400'">
              {{ cycle?.progress_pct }}%
            </span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ cycle?.building_name }} ·
            {{ cycle?.measured_count }} de {{ cycle?.total_apartments }} realizadas
          </p>
        </div>
        <button mat-icon-button (click)="dialogRef.close()" class="cursor-pointer"><mat-icon>close</mat-icon></button>
      </div>

      <!-- Stats row -->
      <div class="px-6 pt-4 grid grid-cols-3 gap-3">
        <div class="bg-slate-700/40 rounded-lg p-3 text-center">
          <p class="text-xl font-bold text-emerald-400">{{ measuredCount() }}</p>
          <p class="text-[10px] text-slate-400">Medidos</p>
        </div>
        <div class="bg-slate-700/40 rounded-lg p-3 text-center">
          <p class="text-xl font-bold text-amber-400">{{ pendingCount() }}</p>
          <p class="text-[10px] text-slate-400">Pendientes</p>
        </div>
        <div class="bg-slate-700/40 rounded-lg p-3 text-center">
          <p class="text-xl font-bold text-white">{{ apartments().length }}</p>
          <p class="text-[10px] text-slate-400">Total</p>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="px-6 pt-3">
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all"
               [class]="cycle?.progress_pct === 100 ? 'bg-emerald-500' : 'bg-cyan-500'"
               [style.width.%]="cycle?.progress_pct ?? 0"></div>
        </div>
      </div>

      <!-- Filters -->
      <div class="px-6 pt-4 pb-2 flex gap-2 flex-wrap">
        <input [(ngModel)]="search" placeholder="Buscar depto, torre, medidor, operador..."
               class="flex-1 min-w-[200px] bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500" />
        <div class="flex gap-1">
          @for (f of statusFilters; track f.value) {
            <button type="button"
                    class="text-xs px-3 py-2 rounded-lg border transition-colors cursor-pointer"
                    [class]="filterStatus === f.value ? f.activeClass : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'"
                    (click)="filterStatus = f.value">
              {{ f.label }}
            </button>
          }
        </div>
        @if (towerNames().length > 1) {
          <select [(ngModel)]="filterTower"
                  class="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none cursor-pointer">
            <option value="">Todas las torres</option>
            @for (t of towerNames(); track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select>
        }
      </div>

      <div class="px-6 pb-1">
        <p class="text-[10px] text-slate-500">{{ filteredApartments().length }} resultado{{ filteredApartments().length !== 1 ? 's' : '' }}
          @if (filterStatus || filterTower || search) {
            · <button type="button" class="text-cyan-400 hover:underline cursor-pointer" (click)="clearFilters()">Limpiar filtros</button>
          }
        </p>
      </div>

      <!-- Table -->
      <div class="overflow-auto px-4 pb-4" style="max-height:calc(80vh - 320px);">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-slate-800 z-10">
            <tr class="text-left text-xs text-slate-400 border-b border-slate-700">
              <th class="py-2 px-2">Torre</th>
              <th class="py-2 px-2">Depto</th>
              <th class="py-2 px-2">Medidor</th>
              <th class="py-2 px-2">Estado</th>
              <th class="py-2 px-2">Lectura</th>
              <th class="py-2 px-2">Fecha</th>
              <th class="py-2 px-2">Operador</th>
              <th class="py-2 px-1 w-8"></th>
            </tr>
          </thead>
          <tbody>
            @for (row of filteredApartments(); track row.apartment_id) {
              <tr class="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                  [class]="row.measured ? '' : 'opacity-70'">
                <td class="py-2 px-2 text-slate-300">{{ row.tower_name }}</td>
                <td class="py-2 px-2 font-semibold text-white">{{ row.apartment_number }}</td>
                <td class="py-2 px-2 font-mono text-xs text-slate-400">{{ row.meter_id }}</td>
                <td class="py-2 px-2">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                        [class]="row.measured ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'">
                    {{ row.measured ? 'Medido' : 'Pendiente' }}
                  </span>
                </td>
                <td class="py-2 px-2 text-cyan-400 font-bold">
                  {{ row.reading_value != null ? (row.reading_value + ' m³') : '—' }}
                </td>
                <td class="py-2 px-2 text-slate-400 text-xs">
                  {{ row.captured_at ? (row.captured_at | date:'dd/MM/yy HH:mm') : '—' }}
                </td>
                <td class="py-2 px-2 text-slate-400 text-xs">{{ row.operator_name ?? '—' }}</td>
                <td class="py-2 px-1">
                  @if (row.measured && row.measurement_id) {
                    <button type="button"
                            class="inline-flex items-center justify-center w-6 h-6 rounded text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors cursor-pointer"
                            matTooltip="Ver medición"
                            (click)="openMeasurement(row)">
                      <mat-icon style="font-size:16px;width:16px;height:16px;">open_in_new</mat-icon>
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (loading()) {
          <div class="py-8 text-center text-slate-400 text-sm">Cargando...</div>
        }
        @if (!loading() && filteredApartments().length === 0) {
          <div class="py-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
            <mat-icon style="font-size:32px;width:32px;height:32px;" class="opacity-40">search_off</mat-icon>
            Sin resultados
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface { background: transparent !important; }
  `],
})
export class CycleProgressDialogComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<CycleProgressDialogComponent>);
  readonly data = inject<{ cycle: MeasurementCycle }>(MAT_DIALOG_DATA);
  private readonly cycleService = inject(CycleService);
  private readonly parentDialog = inject(MatDialog);
  private readonly measurementService = inject(MeasurementService);

  cycle: MeasurementCycle | null = null;
  apartments = signal<CycleProgressApartment[]>([]);
  loading = signal(true);
  search = '';
  filterStatus = '';
  filterTower = '';

  readonly statusFilters = [
    { value: '', label: 'Todos', activeClass: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' },
    { value: 'measured', label: 'Medidos', activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
    { value: 'pending', label: 'Pendientes', activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
  ];

  readonly towerNames = computed(() => {
    const names = new Set(this.apartments().map(a => a.tower_name));
    return [...names].sort();
  });

  readonly measuredCount = computed(() => this.apartments().filter(a => a.measured).length);
  readonly pendingCount = computed(() => this.apartments().filter(a => !a.measured).length);

  readonly filteredApartments = computed(() => {
    let list = this.apartments();
    if (this.filterStatus === 'measured') list = list.filter(a => a.measured);
    else if (this.filterStatus === 'pending') list = list.filter(a => !a.measured);
    if (this.filterTower) list = list.filter(a => a.tower_name === this.filterTower);
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(a =>
        a.apartment_number.toLowerCase().includes(q) ||
        a.tower_name.toLowerCase().includes(q) ||
        a.meter_id.toLowerCase().includes(q) ||
        (a.operator_name ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  });

  clearFilters(): void {
    this.search = '';
    this.filterStatus = '';
    this.filterTower = '';
  }

  openMeasurement(row: CycleProgressApartment): void {
    if (!row.measurement_id) return;
    const measurement = this.measurementService.getMeasurementById(String(row.measurement_id));
    if (measurement) {
      import('../measurements/measurement-detail-dialog.component').then(m => {
        this.parentDialog.open(m.MeasurementDetailDialogComponent, {
          width: '600px',
          panelClass: 'measurement-detail-dialog',
          data: measurement,
        });
      });
    }
  }

  ngOnInit(): void {
    this.cycleService.getCycleProgress(this.data.cycle.id).subscribe({
      next: (res: CycleProgressResponse) => {
        this.cycle = res.cycle;
        this.apartments.set(res.apartments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

/* ─────────────────────────────────────────
   Confirm Enforcement Toggle Dialog
───────────────────────────────────────── */
@Component({
  selector: 'app-confirm-enforcement-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="px-6 pt-6 pb-2">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center"
             [class]="data.enabling ? 'bg-amber-500/15' : 'bg-cyan-500/15'">
          <mat-icon [class]="data.enabling ? 'text-amber-400' : 'text-cyan-400'">
            {{ data.enabling ? 'lock' : 'lock_open' }}
          </mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-white m-0">{{ data.enabling ? 'Activar bloqueo' : 'Desactivar bloqueo' }}</h2>
          @if (data.cycleName) {
            <p class="text-xs text-slate-500 m-0">Ciclo: <strong class="text-slate-300">{{ data.cycleName }}</strong></p>
          }
        </div>
      </div>

      @if (data.enabling) {
        <p class="text-sm text-slate-300 leading-relaxed mb-4">
          ¿Estás seguro de que deseas <strong class="text-amber-400">activar</strong> el bloqueo de mediciones para este ciclo?
        </p>
        <div class="space-y-3 mb-2">
          <div class="flex items-start gap-3 bg-amber-500/5 rounded-lg p-3">
            <mat-icon class="text-amber-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">warning</mat-icon>
            <p class="text-xs text-slate-300 m-0 leading-relaxed">Los operadores solo podrán escanear medidores cuando este ciclo esté en estado <strong class="text-white">"En Curso"</strong>.</p>
          </div>
          <div class="flex items-start gap-3 bg-amber-500/5 rounded-lg p-3">
            <mat-icon class="text-amber-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">block</mat-icon>
            <p class="text-xs text-slate-300 m-0 leading-relaxed">Si el ciclo no está activo, la app <strong class="text-white">rechazará</strong> los intentos de medición para estos departamentos.</p>
          </div>
          <div class="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3">
            <mat-icon class="text-cyan-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">info</mat-icon>
            <p class="text-xs text-slate-400 m-0 leading-relaxed">Asegúrate de que el ciclo esté "En Curso" antes de activar esta opción.</p>
          </div>
        </div>
      } @else {
        <p class="text-sm text-slate-300 leading-relaxed mb-4">
          ¿Estás seguro de que deseas <strong class="text-cyan-400">desactivar</strong> el bloqueo?
        </p>
        <div class="space-y-3 mb-2">
          <div class="flex items-start gap-3 bg-cyan-500/5 rounded-lg p-3">
            <mat-icon class="text-cyan-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">check_circle</mat-icon>
            <p class="text-xs text-slate-300 m-0 leading-relaxed">Los operadores podrán medir en <strong class="text-white">cualquier momento</strong>, con o sin ciclo activo.</p>
          </div>
          <div class="flex items-start gap-3 bg-slate-700/30 rounded-lg p-3">
            <mat-icon class="text-cyan-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">info</mat-icon>
            <p class="text-xs text-slate-400 m-0 leading-relaxed">El ciclo seguirá existiendo como herramienta de organización y seguimiento.</p>
          </div>
        </div>
      }
    </div>
    <div class="flex justify-end gap-2 px-6 pb-5 pt-2">
      <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cancelar</button>
      <button mat-flat-button [mat-dialog-close]="true"
              [class]="data.enabling ? '!bg-amber-500 !text-slate-900 !font-semibold cursor-pointer' : '!bg-cyan-500 !text-slate-900 !font-semibold cursor-pointer'">
        <mat-icon>{{ data.enabling ? 'lock' : 'lock_open' }}</mat-icon>
        {{ data.enabling ? 'Activar bloqueo' : 'Desactivar bloqueo' }}
      </button>
    </div>
  `,
})
export class ConfirmEnforcementDialogComponent {
  readonly data = inject<{ enabling: boolean; cycleName?: string }>(MAT_DIALOG_DATA);
}
