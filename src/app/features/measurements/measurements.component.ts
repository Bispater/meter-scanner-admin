import { Component, inject, signal, computed } from '@angular/core';
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
import { MeasurementService } from '../../core/services/measurement.service';
import { Measurement } from '../../core/models/measurement.model';
import { MeasurementDetailDialogComponent } from './measurement-detail-dialog.component';

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
  ],
  template: `
    <div class="space-y-5">
      <!-- Header -->
      <div>
        <h2 class="text-2xl font-bold text-white">Mediciones</h2>
        <p class="text-slate-400 text-sm mt-1">Historial completo de lecturas de medidores</p>
      </div>

      <!-- Filters -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div class="flex items-center gap-2 mb-4">
          <mat-icon class="text-slate-400" style="font-size:18px;width:18px;height:18px;">filter_list</mat-icon>
          <span class="text-sm font-semibold text-slate-300">Filtros</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <mat-form-field appearance="outline" class="dense-field">
            <mat-label>Torre</mat-label>
            <mat-select [(ngModel)]="filterTower" (ngModelChange)="applyFilters()">
              <mat-option value="">Todas</mat-option>
              @for (t of towers(); track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field">
            <mat-label>Departamento</mat-label>
            <input matInput [(ngModel)]="filterApartment" (ngModelChange)="applyFilters()" placeholder="Ej: 101" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="verified">Validado</mat-option>
              <mat-option value="pending_review">Pendiente</mat-option>
              <mat-option value="rejected">Rechazado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field">
            <mat-label>Desde</mat-label>
            <input matInput type="date" [(ngModel)]="filterDateFrom" (ngModelChange)="applyFilters()" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field">
            <mat-label>Hasta</mat-label>
            <input matInput type="date" [(ngModel)]="filterDateTo" (ngModelChange)="applyFilters()" />
          </mat-form-field>
        </div>

        @if (hasActiveFilters()) {
          <button mat-stroked-button class="!border-slate-600 !text-slate-400 mt-2" (click)="clearFilters()">
            <mat-icon>clear</mat-icon> Limpiar filtros
          </button>
        }
      </div>

      <!-- Results count -->
      <div class="flex items-center justify-between">
        <p class="text-sm text-slate-400">
          {{ filteredData().length }} medición{{ filteredData().length !== 1 ? 'es' : '' }} encontrada{{ filteredData().length !== 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Table -->
      <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="paginatedData()" matSort (matSortChange)="onSort($event)"
                 class="w-full !bg-transparent">

            <!-- Photo -->
            <ng-container matColumnDef="photo">
              <th mat-header-cell *matHeaderCellDef class="!bg-slate-800 !text-slate-400 !font-semibold !text-xs !border-b-slate-700">Foto</th>
              <td mat-cell *matCellDef="let row" class="!bg-transparent !text-slate-200 !border-b-slate-700/50">
                <div class="w-10 h-10 rounded-lg bg-slate-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all"
                     (click)="openDetail(row)">
                  <img [src]="row.photo_url" alt="" class="w-full h-full object-cover"
                    (error)="onImageError($event)" />
                </div>
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
                <span class="text-cyan-400 font-bold">{{ row.reading_value }}</span>
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
                <button mat-icon-button class="!text-slate-400 hover:!text-cyan-400" (click)="openDetail(row)">
                  <mat-icon style="font-size:18px;width:18px;height:18px;">visibility</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                class="cursor-pointer hover:!bg-slate-700/40 transition-colors"
                (click)="openDetail(row)"></tr>
          </table>
        </div>

        @if (filteredData().length === 0) {
          <div class="py-16 text-center">
            <mat-icon class="text-slate-600" style="font-size:48px;width:48px;height:48px;">search_off</mat-icon>
            <p class="text-slate-400 mt-3">No se encontraron mediciones con los filtros aplicados.</p>
          </div>
        }

        <mat-paginator
          [length]="filteredData().length"
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
    ::ng-deep .dense-field .mat-mdc-form-field-infix { padding-top: 8px !important; padding-bottom: 8px !important; min-height: 40px !important; }
    ::ng-deep .mat-mdc-header-cell { white-space: nowrap; }
    ::ng-deep .mat-sort-header-arrow { color: #94a3b8 !important; }
    ::ng-deep .mat-mdc-paginator { border-radius: 0 0 12px 12px; }
  `],
})
export class MeasurementsComponent {
  private readonly measurementService = inject(MeasurementService);
  private readonly dialog = inject(MatDialog);

  readonly towers = this.measurementService.towers;

  filterTower = '';
  filterApartment = '';
  filterStatus = '';
  filterDateFrom = '';
  filterDateTo = '';

  readonly displayedColumns = ['photo', 'tower', 'apartment', 'meter_id', 'reading_value', 'captured_at', 'status', 'actions'];

  readonly filteredData = signal<Measurement[]>(this.measurementService.measurements());
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly paginatedData = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredData().slice(start, start + this.pageSize());
  });

  readonly hasActiveFilters = computed(() =>
    !!(this.filterTower || this.filterApartment || this.filterStatus || this.filterDateFrom || this.filterDateTo)
  );

  applyFilters(): void {
    const result = this.measurementService.getFilteredMeasurements({
      tower: this.filterTower || undefined,
      apartment: this.filterApartment || undefined,
      status: this.filterStatus || undefined,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
    });
    this.filteredData.set(result);
    this.pageIndex.set(0);
  }

  clearFilters(): void {
    this.filterTower = '';
    this.filterApartment = '';
    this.filterStatus = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFilters();
  }

  onSort(sort: Sort): void {
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
    this.dialog.open(MeasurementDetailDialogComponent, {
      data: measurement,
      panelClass: 'custom-dialog',
      maxWidth: '600px',
      width: '95vw',
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'https://via.placeholder.com/80x80/1e293b/64748b?text=N/A';
  }
}
