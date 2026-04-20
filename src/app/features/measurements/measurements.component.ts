import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MeasurementService } from '../../core/services/measurement.service';
import { Measurement } from '../../core/models/measurement.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CycleService } from '../../core/services/cycle.service';
import { MeasurementDetailDialogComponent } from './measurement-detail-dialog.component';
import { MeasurementDetailDialogData } from './measurement-detail-dialog.types';
import { NotificationService } from '../../core/services/notification.service';
import { ImageLightboxDialogComponent } from './image-lightbox-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { formatMeterReadingDisplay } from '../../shared/utils/meter-reading-format';

@Component({
  selector: 'app-measurements',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDatepickerModule,
  ],
  template: `
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-white">Mediciones</h2>
          <p class="text-slate-400 text-sm mt-1">Historial completo de lecturas de medidores</p>
          <p class="text-slate-500 text-xs mt-1 max-w-xl">
            Las eliminadas permanecen en la papelera <strong class="text-slate-400">30 días</strong> y pueden recuperarse.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button mat-stroked-button
                  [class]="showTrash() ? '!border-slate-600 !text-slate-400' : '!border-cyan-500/50 !text-cyan-400'"
                  class="cursor-pointer"
                  (click)="setTrashMode(false)">
            <mat-icon>list</mat-icon> Activas
          </button>
          <button mat-stroked-button
                  [class]="showTrash() ? '!border-amber-500/50 !text-amber-400' : '!border-slate-600 !text-slate-400'"
                  class="cursor-pointer"
                  (click)="setTrashMode(true)">
            <mat-icon>delete_outline</mat-icon> Papelera
          </button>
          @if (!showTrash()) {
            <button
              mat-stroked-button
              class="!border-amber-500/40 !text-amber-300 cursor-pointer"
              (click)="openPendingReviewAlbum()"
              matTooltip="Recorrer solo las pendientes y validar sin cerrar el panel"
            >
              <mat-icon>view_carousel</mat-icon> Revisar pendientes
            </button>
          }
          <button mat-flat-button class="!bg-cyan-600 !text-white cursor-pointer" (click)="refresh()" matTooltip="Actualizar datos">
            <mat-icon>refresh</mat-icon> Actualizar
          </button>
        </div>
      </div>

      <!-- Filters -->
      @if (!showTrash()) {
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div class="flex items-center gap-2 mb-4">
          <mat-icon class="text-slate-400" style="font-size:18px;width:18px;height:18px;">filter_list</mat-icon>
          <span class="text-sm font-semibold text-slate-300">Filtros</span>
        </div>
        <!-- Ciclo: opcional; filtra por el ciclo real de la medición (no solo fechas). -->
        <div class="mb-3 flex flex-col gap-1">
          <mat-form-field appearance="outline" class="dense-field w-full md:w-[28rem]">
            <mat-label>Ciclo (opcional)</mat-label>
            <mat-select [(ngModel)]="filterCycle" (ngModelChange)="onCycleFilterChange($event)">
              <mat-option value="">Todos los ciclos</mat-option>
              @for (c of cycleService.cycles(); track c.id) {
                <mat-option [value]="c.id">
                  {{ c.name }} — {{ c.building_name }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>
          <p class="text-xs text-slate-500 max-w-xl">
            Si eliges un ciclo, se muestran solo mediciones <strong class="text-slate-400">asignadas a ese ciclo</strong> en el sistema.
            Las fechas abajo son opcionales para acotar por día de captura.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Edificio</mat-label>
            <mat-select [(ngModel)]="filterBuilding" (ngModelChange)="applyFilters()">
              <mat-option value="">Todos</mat-option>
              @for (b of buildings(); track b) {
                <mat-option [value]="b">{{ b }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Torre</mat-label>
            <mat-select [(ngModel)]="filterTower" (ngModelChange)="applyFilters()">
              <mat-option value="">Todas</mat-option>
              @for (t of towers(); track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Departamento</mat-label>
            <input matInput [(ngModel)]="filterApartment" (ngModelChange)="applyFilters()" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="verified">Validado</mat-option>
              <mat-option value="pending_review">Pendiente</mat-option>
              <mat-option value="rejected">Rechazado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Desde</mat-label>
            <input matInput [matDatepicker]="fromPicker" [(ngModel)]="filterDateFromObj"
                   (dateChange)="onDateFromChange()" readonly />
            <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
            <mat-datepicker #fromPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Hasta</mat-label>
            <input matInput [matDatepicker]="toPicker" [(ngModel)]="filterDateToObj"
                   [min]="filterDateFromObj" (dateChange)="onDateToChange()" readonly />
            <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
            <mat-datepicker #toPicker></mat-datepicker>
          </mat-form-field>
        </div>

        @if (hasActiveFilters()) {
          <button mat-stroked-button class="!border-slate-600 !text-slate-400 mt-2" (click)="clearFilters()">
            <mat-icon>clear</mat-icon> Limpiar filtros
          </button>
        }
      </div>
      } @else {
      <div class="bg-amber-500/10 rounded-xl border border-amber-500/25 p-4">
        <p class="text-sm text-amber-200/90">
          <mat-icon class="align-middle mr-1" style="font-size:18px;width:18px;height:18px;">info</mat-icon>
          Solo administradores. Tras 30 días desde la eliminación, el registro se borra definitivamente del servidor (comando de mantenimiento).
        </p>
      </div>
      }

      <!-- Results count -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-400">
          {{ displayData().length }} {{ displayData().length === 1 ? 'medición' : 'mediciones' }}
          @if (showTrash()) { en papelera } @else { encontrada{{ displayData().length !== 1 ? 's' : '' }} }
        </p>
      </div>

      <!-- Table -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div class="overflow-x-auto">
          @if (!showTrash()) {
          <table mat-table [dataSource]="paginatedData()" matSort (matSortChange)="onSort($event)"
                 class="w-full !bg-transparent">

            <!-- Photo -->
            <ng-container matColumnDef="photo">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Foto</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-200 !border-b-slate-700/50">
                @if (row.photo_url) {
                  <button type="button"
                          class="group relative w-10 h-10 rounded-lg bg-slate-700 overflow-hidden cursor-zoom-in hover:ring-2 hover:ring-cyan-400 transition-all"
                          (click)="openImage($event, row)"
                          matTooltip="Ver foto en grande">
                    <img [src]="row.photo_url" alt="Foto medición {{ row.meter_id }}" class="w-full h-full object-cover" />
                    <span class="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors"></span>
                    <mat-icon class="!absolute !inset-0 m-auto text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              style="font-size:16px;width:16px;height:16px;">zoom_in</mat-icon>
                  </button>
                } @else {
                  <div class="w-10 h-10 rounded-lg bg-slate-700/70 border border-slate-600 flex items-center justify-center"
                       matTooltip="Sin foto">
                    <mat-icon class="text-slate-500" style="font-size:16px;width:16px;height:16px;">no_photography</mat-icon>
                  </div>
                }
              </td>
            </ng-container>

            <!-- Building -->
            <ng-container matColumnDef="building_name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Edificio</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-200 !border-b-slate-700/50">
                <span class="font-medium text-slate-100">{{ row.building_name || '—' }}</span>
              </td>
            </ng-container>

            <!-- Tower -->
            <ng-container matColumnDef="tower">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Torre</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-200 !border-b-slate-700/50">
                <span class="font-medium">{{ row.tower }}</span>
              </td>
            </ng-container>

            <!-- Apartment -->
            <ng-container matColumnDef="apartment">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Depto</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-200 !border-b-slate-700/50">
                {{ row.apartment }}
              </td>
            </ng-container>

            <!-- Meter ID -->
            <ng-container matColumnDef="meter_id">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Medidor</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-200 !border-b-slate-700/50">
                <span class="font-mono text-xs bg-slate-700 px-2 py-0.5 rounded">{{ row.meter_id }}</span>
              </td>
            </ng-container>

            <!-- Reading -->
            <ng-container matColumnDef="reading_value">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Lectura (m³)</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !border-b-slate-700/50">
                <span class="text-cyan-400 font-bold">{{ formatMeterReadingDisplay(row.reading_value, row.reading_layout) }}</span>
                <span class="text-slate-500 text-xs ml-1">m³</span>
              </td>
            </ng-container>

            <!-- Date -->
            <ng-container matColumnDef="captured_at">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Fecha / Hora</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-300 !border-b-slate-700/50 text-sm">
                {{ row.captured_at | date:'dd/MM/yyyy HH:mm' }}
              </td>
            </ng-container>

            <!-- Time Ago -->
            <ng-container matColumnDef="time_ago">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Hace</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-400 !border-b-slate-700/50 text-xs whitespace-nowrap">
                {{ timeAgo(row.captured_at) }}
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Estado</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !border-b-slate-700/50">
                <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                  [class]="row.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400' :
                           row.status === 'pending_review' ? 'bg-amber-500/15 text-amber-400' :
                           'bg-red-500/15 text-red-400'">
                  {{ row.status === 'verified' ? 'Validado' : row.status === 'pending_review' ? 'Pendiente' : 'Rechazado' }}
                </span>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700"></th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !border-b-slate-700/50">
                @if (row.photo_url) {
                  <button mat-icon-button class="!text-slate-400 hover:!text-indigo-300"
                          (click)="openImage($event, row)" matTooltip="Abrir foto">
                    <mat-icon style="font-size:18px;width:18px;height:18px;">image</mat-icon>
                  </button>
                }
                <button mat-icon-button class="!text-slate-400 hover:!text-cyan-400" (click)="openDetail(row)" matTooltip="Ver detalle">
                  <mat-icon style="font-size:18px;width:18px;height:18px;">visibility</mat-icon>
                </button>
                <button mat-icon-button class="!text-slate-400 hover:!text-red-400" (click)="deleteMeasurement($event, row)" matTooltip="Eliminar">
                  <mat-icon style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="cursor-pointer hover:!bg-slate-700/40 transition-colors"
                (click)="openDetail(row)"></tr>
          </table>
          } @else {
          <table mat-table [dataSource]="paginatedData()" class="w-full !bg-transparent">
            <ng-container matColumnDef="photo">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Foto</th>
              <td mat-cell *matCellDef="let row" class="!border-b-slate-700/50">
                @if (row.photo_url) {
                  <button type="button" class="w-10 h-10 rounded-lg overflow-hidden cursor-pointer"
                          (click)="openImage($event, row)">
                    <img [src]="row.photo_url" alt="" class="w-full h-full object-cover" />
                  </button>
                } @else { <span class="text-slate-600">—</span> }
              </td>
            </ng-container>
            <ng-container matColumnDef="building_name">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs">Edificio</th>
              <td mat-cell *matCellDef="let row">{{ row.building_name || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="tower">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs">Torre</th>
              <td mat-cell *matCellDef="let row">{{ row.tower }}</td>
            </ng-container>
            <ng-container matColumnDef="apartment">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs">Depto</th>
              <td mat-cell *matCellDef="let row">{{ row.apartment }}</td>
            </ng-container>
            <ng-container matColumnDef="meter_id">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs">Medidor</th>
              <td mat-cell *matCellDef="let row"><span class="font-mono text-xs">{{ row.meter_id }}</span></td>
            </ng-container>
            <ng-container matColumnDef="reading_value">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs">Lectura</th>
              <td mat-cell *matCellDef="let row" class="text-cyan-400 font-bold">{{ formatMeterReadingDisplay(row.reading_value, row.reading_layout) }}</td>
            </ng-container>
            <ng-container matColumnDef="captured_at">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs">Captura</th>
              <td mat-cell *matCellDef="let row" class="text-sm">{{ row.captured_at | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>
            <ng-container matColumnDef="deleted_meta">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs">Eliminada</th>
              <td mat-cell *matCellDef="let row" class="text-sm text-slate-400">
                {{ row.deleted_at | date:'dd/MM/yyyy HH:mm' }}
                @if (row.retention_days_remaining != null) {
                  <span class="block text-xs text-amber-400/90">~{{ row.retention_days_remaining }} días para borrado total</span>
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="actions_trash">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !text-xs"></th>
              <td mat-cell *matCellDef="let row">
                <button mat-flat-button class="!bg-emerald-600 !text-white !text-xs cursor-pointer"
                        (click)="restoreRow($event, row)">
                  <mat-icon style="font-size:16px;width:16px;height:16px;">restore</mat-icon> Restaurar
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="trashColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: trashColumns;" class="hover:!bg-slate-700/30"></tr>
          </table>
          }
        </div>

        @if (displayData().length === 0) {
          <div class="py-16 text-center">
            <mat-icon class="text-slate-600" style="font-size:48px;width:48px;height:48px;">search_off</mat-icon>
            <p class="text-slate-400 mt-3">
              @if (showTrash()) { La papelera está vacía. } @else { No se encontraron mediciones con los filtros aplicados. }
            </p>
          </div>
        }

        <mat-paginator
          [length]="displayData().length"
          [pageSize]="pageSize()"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="onPageChange($event)"
          class="!bg-slate-800 !text-slate-400 !border-t !border-slate-700"
        />
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
    ::ng-deep .dense-field .mat-mdc-text-field-wrapper {
      height: 48px !important;
    }
    ::ng-deep .dense-field .mat-mdc-form-field-flex {
      height: 48px !important;
      align-items: center !important;
    }
    ::ng-deep .mat-mdc-header-cell { white-space: nowrap; }
    ::ng-deep .mat-sort-header-arrow { color: #94a3b8 !important; }
    ::ng-deep .mat-mdc-paginator { border-radius: 0 0 12px 12px; }
  `],
})
export class MeasurementsComponent implements OnInit, OnDestroy {
  readonly formatMeterReadingDisplay = formatMeterReadingDisplay;
  private readonly measurementService = inject(MeasurementService);
  readonly cycleService = inject(CycleService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private _dialogOpen = false;

  readonly towers = this.measurementService.towers;
  readonly buildings = this.measurementService.buildings;

  filterTower = '';
  filterBuilding = '';
  filterApartment = '';
  filterStatus = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterCycle = '';

  filterDateFromObj: Date | null = null;
  filterDateToObj: Date | null = null;

  readonly displayedColumns = ['photo', 'building_name', 'tower', 'apartment', 'meter_id', 'reading_value', 'captured_at', 'time_ago', 'status', 'actions'];
  readonly trashColumns = ['photo', 'building_name', 'tower', 'apartment', 'meter_id', 'reading_value', 'captured_at', 'deleted_meta', 'actions_trash'];

  readonly showTrash = signal(false);

  readonly filteredData = signal<Measurement[]>([]);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly displayData = computed(() =>
    this.showTrash() ? this.measurementService.trash() : this.filteredData()
  );

  ngOnInit(): void {
    // Sin rango por defecto: se listan todas las mediciones cargadas; fechas y ciclo son opcionales.

    this.measurementService.onLoaded(() => this.applyFilters());
    if (this.measurementService.measurements().length > 0) {
      this.applyFilters();
    }
    this.refreshInterval = setInterval(() => this.refresh(), 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  refresh(): void {
    this.measurementService.loadAll();
    this.measurementService.loadTrash();
  }

  setTrashMode(v: boolean): void {
    this.showTrash.set(v);
    this.pageIndex.set(0);
    if (v) {
      this.measurementService.loadTrash();
    }
  }

  restoreRow(event: Event, row: Measurement): void {
    event.stopPropagation();
    void this.measurementService.restoreMeasurement(row.id);
  }

  readonly paginatedData = computed(() => {
    const data = this.displayData();
    const start = this.pageIndex() * this.pageSize();
    return data.slice(start, start + this.pageSize());
  });

  readonly hasActiveFilters = computed(() =>
    !!(this.filterTower || this.filterBuilding || this.filterApartment || this.filterStatus || this.filterDateFrom || this.filterDateTo || this.filterCycle)
  );

  applyFilters(): void {
    const result = this.measurementService.getFilteredMeasurements({
      cycleId: this.filterCycle || undefined,
      building: this.filterBuilding || undefined,
      tower: this.filterTower || undefined,
      apartment: this.filterApartment || undefined,
      status: this.filterStatus || undefined,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
    });
    this.filteredData.set(result);
    this.pageIndex.set(0);
  }

  onCycleFilterChange(_cycleId: string): void {
    this.applyFilters();
  }

  onDateFromChange(): void {
    this.filterDateFrom = this.filterDateFromObj ? this._formatDate(this.filterDateFromObj) : '';
    this.applyFilters();
  }

  onDateToChange(): void {
    this.filterDateTo = this.filterDateToObj ? this._formatDate(this.filterDateToObj) : '';
    this.applyFilters();
  }

  private _formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  clearFilters(): void {
    this.filterTower = '';
    this.filterBuilding = '';
    this.filterApartment = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterDateFromObj = null;
    this.filterDateToObj = null;
    this.filterCycle = '';
    this.applyFilters();
  }

  onSort(sort: Sort): void {
    if (this.showTrash()) {
      return;
    }
    const data = [...this.filteredData()];
    if (!sort.active || sort.direction === '') {
      return;
    }
    data.sort((a: any, b: any) => {
      const isAsc = sort.direction === 'asc';
      const valA = a[sort.active];
      const valB = b[sort.active];
      if (typeof valA === 'number') return (valA - valB) * (isAsc ? 1 : -1);
      return String(valA).localeCompare(String(valB)) * (isAsc ? 1 : -1);
    });
    this.filteredData.set(data);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  openDetail(measurement: Measurement): void {
    let data: MeasurementDetailDialogData = { measurement };
    if (measurement.status === 'pending_review') {
      const pending = this.filteredData()
        .filter(m => m.status === 'pending_review')
        .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
      data = { measurement, reviewQueue: pending };
    }
    this.openDetailDialog(data);
  }

  /** Modo álbum: misma lista de pendientes que ves con los filtros actuales. */
  openPendingReviewAlbum(): void {
    const pending = this.filteredData()
      .filter(m => m.status === 'pending_review')
      .sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
    if (pending.length === 0) {
      this.notify.info('No hay mediciones pendientes con los filtros actuales.');
      return;
    }
    this.openDetailDialog({ measurement: pending[0], reviewQueue: pending });
  }

  private openDetailDialog(data: MeasurementDetailDialogData): void {
    if (this._dialogOpen) return;
    this._dialogOpen = true;
    const ref = this.dialog.open(MeasurementDetailDialogComponent, {
      data,
      panelClass: 'measurement-detail-dialog',
      maxWidth: '900px',
      width: '96vw',
    });
    ref.afterClosed().subscribe(result => {
      setTimeout(() => {
        this._dialogOpen = false;
      }, 400);
      if (result === 'deleted' || result === 'updated') {
        setTimeout(() => this.applyFilters(), 300);
      }
    });
  }

  openImage(event: Event, measurement: Measurement): void {
    event.stopPropagation();
    if (!measurement.photo_url) return;
    this.dialog.open(ImageLightboxDialogComponent, {
      data: { photoUrl: measurement.photo_url, alt: `Medidor ${measurement.meter_id}` },
      panelClass: 'lightbox-dialog',
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100vw',
      height: '100vh',
    });
  }

  deleteMeasurement(event: Event, measurement: Measurement): void {
    event.stopPropagation();
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      panelClass: ['dark-dialog', 'nested-confirm-dialog'],
      data: {
        title: 'Enviar a la papelera',
        message:
          `¿Estás seguro de que deseas eliminar la medición #${measurement.id} del medidor ${measurement.meter_id}? ` +
          'Quedará en la papelera 30 días y podrás restaurarla desde la pestaña Papelera.',
        confirmText: 'Enviar a papelera',
        type: 'danger',
      },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.measurementService.deleteMeasurement(measurement.id);
      setTimeout(() => this.applyFilters(), 300);
    });
  }

  timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'ahora';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 día';
    if (days < 30) return `${days} días`;
    const months = Math.floor(days / 30);
    if (months === 1) return '1 mes';
    return `${months} meses`;
  }

}
