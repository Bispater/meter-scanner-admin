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
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CycleService } from '../../core/services/cycle.service';
import { BuildingService } from '../../core/services/building.service';
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
        <button mat-flat-button class="!bg-cyan-600 !text-white" (click)="openCreate()">
          <mat-icon>add</mat-icon> Nuevo Ciclo
        </button>
      </div>

      <!-- Enforcement toggle -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
               [class]="cycleEnforcement() ? 'bg-amber-500/10' : 'bg-slate-700'">
            <mat-icon style="font-size:18px;width:18px;height:18px;"
                      [class]="cycleEnforcement() ? 'text-amber-400' : 'text-slate-500'">lock</mat-icon>
          </div>
          <div>
            <p class="text-sm font-semibold text-white">Bloquear mediciones fuera de ciclo</p>
            <p class="text-xs text-slate-400">
              @if (cycleEnforcement()) {
                Los operarios <strong class="text-amber-400">solo podrán medir</strong> durante ciclos activos.
              } @else {
                Los ciclos son informativos. Los operarios pueden medir <strong class="text-slate-300">en cualquier momento</strong>.
              }
            </p>
          </div>
        </div>
        <mat-slide-toggle [checked]="cycleEnforcement()" (change)="toggleEnforcement($event.checked)" color="warn" />
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
              <div class="flex flex-col gap-2 shrink-0">
                <button mat-stroked-button class="!border-slate-600 !text-slate-300 text-xs"
                        (click)="openProgress(cycle)">
                  <mat-icon style="font-size:16px;width:16px;height:16px;">visibility</mat-icon>
                  Ver Progreso
                </button>
                <mat-select class="text-xs !bg-slate-700 rounded px-2 py-1"
                            [value]="cycle.status"
                            (valueChange)="onStatusChange(cycle, $event)"
                            style="font-size:12px">
                  <mat-option value="pending">Pendiente</mat-option>
                  <mat-option value="in_progress">En Curso</mat-option>
                  <mat-option value="completed">Completado</mat-option>
                  <mat-option value="closed">Cerrado</mat-option>
                </mat-select>
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

  readonly cycleEnforcement = signal(localStorage.getItem('metscan_cycle_enforcement') === 'true');

  toggleEnforcement(value: boolean): void {
    this.cycleEnforcement.set(value);
    localStorage.setItem('metscan_cycle_enforcement', String(value));
  }

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
      panelClass: 'dark-dialog',
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.cycleService.createCycle(result);
    });
  }

  openProgress(cycle: MeasurementCycle): void {
    this.dialog.open(CycleProgressDialogComponent, {
      width: '90vw',
      maxWidth: '900px',
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
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="!text-white">Nuevo Ciclo de Medición</h2>
    <mat-dialog-content class="!pt-3 space-y-4">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Nombre del Ciclo</mat-label>
        <input matInput [(ngModel)]="form.name" placeholder="Ej: Ciclo Mayo 2025" />
      </mat-form-field>

      <div class="grid grid-cols-2 gap-4">
        <mat-form-field appearance="outline">
          <mat-label>Edificio</mat-label>
          <mat-select [(ngModel)]="form.building">
            @for (b of buildings(); track b.id) {
              <mat-option [value]="+b.id">{{ b.name }}</mat-option>
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
          <input matInput type="date" [(ngModel)]="form.scheduled_date" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fecha Límite</mat-label>
          <input matInput type="date" [(ngModel)]="form.deadline" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Notas (opcional)</mat-label>
        <textarea matInput [(ngModel)]="form.notes" rows="2"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400">Cancelar</button>
      <button mat-flat-button class="!bg-cyan-600 !text-white"
              [disabled]="!isValid()"
              [mat-dialog-close]="form">
        <mat-icon>add</mat-icon> Crear Ciclo
      </button>
    </mat-dialog-actions>
  `,
})
export class CreateCycleDialogComponent {
  private readonly buildingService = inject(BuildingService);
  readonly buildings = this.buildingService.buildings;

  readonly months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  form = {
    name: '',
    building: null as number | null,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    scheduled_date: '',
    deadline: '',
    status: 'pending',
    notes: '',
  };

  isValid(): boolean {
    return !!(this.form.name && this.form.building && this.form.year && this.form.month
      && this.form.scheduled_date && this.form.deadline);
  }
}

/* ─────────────────────────────────────────
   Cycle Progress Dialog
───────────────────────────────────────── */
@Component({
  selector: 'app-cycle-progress-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatTableModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="bg-slate-800 text-slate-200">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div>
          <h2 class="text-lg font-bold text-white">{{ cycle?.name }}</h2>
          <p class="text-xs text-slate-400 mt-0.5">
            {{ cycle?.building_name }} ·
            {{ cycle?.measured_count }} de {{ cycle?.total_apartments }} realizadas ({{ cycle?.progress_pct }}%)
          </p>
        </div>
        <button mat-icon-button (click)="dialogRef.close()"><mat-icon>close</mat-icon></button>
      </div>

      <!-- Progress bar -->
      <div class="px-6 pt-4">
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-cyan-500 rounded-full transition-all"
               [style.width.%]="cycle?.progress_pct ?? 0"></div>
        </div>
      </div>

      <!-- Search + filter -->
      <div class="px-6 pt-4 pb-2 flex gap-3">
        <input [(ngModel)]="search" placeholder="Buscar depto, torre, medidor..."
               class="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500" />
        <select [(ngModel)]="filterStatus"
                class="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none">
          <option value="">Todos</option>
          <option value="measured">Medidos</option>
          <option value="pending">Pendientes</option>
        </select>
      </div>

      <!-- Table -->
      <div class="overflow-auto max-h-[55vh] px-4 pb-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-xs text-slate-400 border-b border-slate-700">
              <th class="py-2 px-2">Torre</th>
              <th class="py-2 px-2">Depto</th>
              <th class="py-2 px-2">Medidor</th>
              <th class="py-2 px-2">Estado</th>
              <th class="py-2 px-2">Lectura</th>
              <th class="py-2 px-2">Fecha</th>
              <th class="py-2 px-2">Operador</th>
            </tr>
          </thead>
          <tbody>
            @for (row of filteredApartments(); track row.apartment_id) {
              <tr class="border-b border-slate-700/50 hover:bg-slate-700/30">
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
              </tr>
            }
          </tbody>
        </table>

        @if (loading()) {
          <div class="py-8 text-center text-slate-400 text-sm">Cargando...</div>
        }
        @if (!loading() && filteredApartments().length === 0) {
          <div class="py-8 text-center text-slate-500 text-sm">Sin resultados</div>
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

  cycle: MeasurementCycle | null = null;
  apartments = signal<CycleProgressApartment[]>([]);
  loading = signal(true);
  search = '';
  filterStatus = '';

  readonly filteredApartments = computed(() => {
    let list = this.apartments();
    if (this.filterStatus === 'measured') list = list.filter(a => a.measured);
    else if (this.filterStatus === 'pending') list = list.filter(a => !a.measured);
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
