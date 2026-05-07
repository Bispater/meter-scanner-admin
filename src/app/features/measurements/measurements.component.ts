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
import { MatMenuModule } from '@angular/material/menu';
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
import { ExportService, ExportColumn, ExportFormat } from '../../shared/utils/export.service';
import { MeasurementPhotoExportService, ZIP_CANCELLED } from '../../shared/utils/measurement-photo-export.service';
import { MeasurementCoverageComponent } from './measurement-coverage.component';
import { ZipProgressDialogComponent } from './zip-progress-dialog.component';

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
    MatMenuModule,
    MeasurementCoverageComponent,
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
                  [class]="!showTrash() && !pendingOnly() ? '!border-cyan-500/50 !text-cyan-400' : '!border-slate-600 !text-slate-400'"
                  class="cursor-pointer"
                  (click)="setTrashMode(false)">
            <mat-icon>list</mat-icon> Activas
          </button>
          <button mat-stroked-button
                  [class]="pendingOnly() && !showTrash() ? '!border-amber-500/60 !text-amber-300' : '!border-slate-600 !text-slate-400'"
                  class="cursor-pointer"
                  (click)="showOnlyPending()"
                  matTooltip="Filtrar tabla a mediciones pendientes de validar">
            <mat-icon>pending_actions</mat-icon>
            Pendientes
            <span class="ml-1 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-[11px] font-bold"
                  [class]="pendingCount() > 0 ? 'bg-amber-500/25 text-amber-200' : 'bg-slate-700 text-slate-400'">
              {{ pendingCount() }}
            </span>
          </button>
          <button mat-stroked-button
                  [class]="filterDuplicates === 'duplicates' && !showTrash() ? '!border-rose-500/60 !text-rose-300' : '!border-slate-600 !text-slate-400'"
                  class="cursor-pointer"
                  (click)="showOnlyDuplicates()"
                  [disabled]="duplicateRowsCount() === 0"
                  matTooltip="Filtrar a deptos con 2+ mediciones en el mismo mes (agrupados para revisar)">
            <mat-icon>content_copy</mat-icon>
            Duplicados
            <span class="ml-1 inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1.5 rounded-full text-[11px] font-bold"
                  [class]="duplicateRowsCount() > 0 ? 'bg-rose-500/25 text-rose-200' : 'bg-slate-700 text-slate-400'">
              {{ duplicateRowsCount() }}
            </span>
          </button>
          <button mat-stroked-button
                  [class]="showTrash() ? '!border-amber-500/50 !text-amber-400' : '!border-slate-600 !text-slate-400'"
                  class="cursor-pointer"
                  (click)="setTrashMode(true)">
            <mat-icon>delete_outline</mat-icon> Papelera
          </button>
          @if (!showTrash() && pendingCount() > 0) {
            <button
              mat-stroked-button
              class="!border-amber-500/40 !text-amber-300 cursor-pointer"
              (click)="openPendingReviewAlbum()"
              matTooltip="Recorrer solo las pendientes y validar sin cerrar el panel"
            >
              <mat-icon>view_carousel</mat-icon> Revisar pendientes
            </button>
          }
          <button mat-stroked-button
                  [class]="viewMode() === 'coverage' ? '!border-cyan-500/60 !text-cyan-300' : '!border-slate-600 !text-slate-300'"
                  class="cursor-pointer"
                  (click)="toggleViewMode()"
                  matTooltip="Cambiar entre tabla y vista de cobertura (faltantes)">
            <mat-icon>{{ viewMode() === 'coverage' ? 'table_chart' : 'grid_view' }}</mat-icon>
            {{ viewMode() === 'coverage' ? 'Vista tabla' : 'Cobertura' }}
          </button>
          <button mat-stroked-button
                  class="!border-slate-600 !text-slate-300 cursor-pointer"
                  [matMenuTriggerFor]="exportMenu"
                  [disabled]="displayData().length === 0"
                  matTooltip="Exportar mediciones visibles">
            <mat-icon>download</mat-icon> Exportar
          </button>
          <mat-menu #exportMenu="matMenu">
            <button mat-menu-item (click)="exportMeasurements('xlsx')">
              <mat-icon>grid_on</mat-icon>
              <span>Exportar a XLSX</span>
            </button>
            <button mat-menu-item (click)="exportMeasurements('csv')">
              <mat-icon>description</mat-icon>
              <span>Exportar a CSV</span>
            </button>
            <button mat-menu-item
                    (click)="exportPhotosZip()"
                    [disabled]="exportZipBusy || photosInDisplayCount() === 0"
                    matTooltip="El ZIP se arma en el servidor, en carpetas Edificio/Torre — incluye solo las filas visibles con foto">
              <mat-icon [class.animate-spin]="exportZipBusy">{{ exportZipBusy ? 'progress_activity' : 'archive' }}</mat-icon>
              <span>{{ exportZipBusy ? 'Preparando ZIP… (' + photosInDisplayCount() + ' fotos)' : 'Exportar fotos (ZIP)' }}</span>
            </button>
          </mat-menu>
          <button mat-flat-button
                  class="!bg-cyan-600 !text-white cursor-pointer"
                  (click)="refresh()"
                  [disabled]="loading()"
                  [matTooltip]="loading() ? 'Sincronizando con el servidor…' : 'Actualizar datos (auto cada 30s)'">
            <mat-icon [class.animate-spin]="loading()">{{ loading() ? 'progress_activity' : 'refresh' }}</mat-icon>
            <span>{{ loading() ? 'Actualizando…' : 'Actualizar' }}</span>
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

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-start">
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

          <mat-form-field appearance="outline" class="dense-field w-full"
                          matTooltip="Duplicados = mismo edificio+torre+depto en el mismo mes calendario">
            <mat-label>Duplicados</mat-label>
            <mat-select [(ngModel)]="filterDuplicates" (ngModelChange)="applyFilters()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="duplicates">Solo repetidos ({{ duplicateRowsCount() }})</mat-option>
              <mat-option value="unique">Solo únicos</mat-option>
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

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Año (captura)</mat-label>
            <mat-select [(ngModel)]="filterYearPreset" (ngModelChange)="onCaptureMonthPresetChange()">
              <mat-option value="">Cualquier año</mat-option>
              @for (y of availableYears(); track y) {
                <mat-option [value]="y">{{ y }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Mes (captura)</mat-label>
            <mat-select [(ngModel)]="filterMonthPreset" (ngModelChange)="onCaptureMonthPresetChange()">
              <mat-option value="">Cualquier mes</mat-option>
              @for (mo of captureMonthLabels; track mo.value) {
                <mat-option [value]="mo.value">{{ mo.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
        <p class="text-xs text-slate-500 mt-3 max-w-3xl">
          <strong class="text-slate-400">Mes y año de captura</strong> ajustan automáticamente «Desde» y «Hasta» a ese mes.
          Combínalos con torre y departamento para un lote concreto (p. ej. abril 2026, Torre A, P 03).
          La exportación (tabla o ZIP de fotos) incluye solo las filas visibles tras los filtros.
        </p>

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

      @if (viewMode() === 'coverage' && !showTrash()) {
        <app-measurement-coverage
          [filterBuilding]="filterBuilding"
          [filterTower]="filterTower"
          [filterCycle]="filterCycle"
          [filterYear]="filterYearPreset"
          [filterMonth]="filterMonthPreset"
        />
      } @else {
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
                <span class="inline-flex items-center gap-1.5">
                  {{ row.apartment }}
                  @if (duplicateCountFor(row) > 1) {
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          [matTooltip]="'Hay ' + duplicateCountFor(row) + ' mediciones de este depto en ' + monthLabelFor(row)">
                      {{ duplicateCountFor(row) }}x
                    </span>
                  }
                </span>
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
          [pageSizeOptions]="[10, 25, 50, 100, 250, 500]"
          (page)="onPageChange($event)"
          class="!bg-slate-800 !text-slate-400 !border-t !border-slate-700"
        />
      </div>
      }
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
  readonly captureMonthLabels = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ] as const;

  readonly availableYears = computed(() => {
    const ys = new Set<number>();
    // Siempre incluir el año actual aunque no tenga mediciones aún (para autocompletado en cobertura).
    ys.add(new Date().getFullYear());
    for (const m of this.measurementService.measurements()) {
      const y = new Date(m.captured_at).getFullYear();
      if (!Number.isNaN(y)) ys.add(y);
    }
    return [...ys].sort((a, b) => b - a);
  });

  private readonly measurementService = inject(MeasurementService);
  readonly cycleService = inject(CycleService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly exportService = inject(ExportService);
  private readonly photoExport = inject(MeasurementPhotoExportService);

  exportZipBusy = false;
  filterYearPreset: number | '' = '';
  filterMonthPreset: number | '' = '';
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private _dialogOpen = false;

  readonly towers = this.measurementService.towers;
  readonly buildings = this.measurementService.buildings;
  /** Estado de carga global (loadAll en vuelo, sea manual o por auto-refresh cada 30s). */
  readonly loading = this.measurementService.loading;

  filterTower = '';
  filterBuilding = '';
  filterApartment = '';
  filterStatus = '';
  filterDateFrom = '';
  filterDateTo = '';
  filterCycle = '';
  filterDuplicates: '' | 'duplicates' | 'unique' = '';

  filterDateFromObj: Date | null = null;
  filterDateToObj: Date | null = null;

  readonly displayedColumns = ['photo', 'building_name', 'tower', 'apartment', 'meter_id', 'reading_value', 'captured_at', 'time_ago', 'status', 'actions'];
  readonly trashColumns = ['photo', 'building_name', 'tower', 'apartment', 'meter_id', 'reading_value', 'captured_at', 'deleted_meta', 'actions_trash'];

  readonly showTrash = signal(false);
  /** 'table' = listado paginado tradicional · 'coverage' = grilla de deptos por torre. */
  readonly viewMode = signal<'table' | 'coverage'>('table');

  readonly filteredData = signal<Measurement[]>([]);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly displayData = computed(() =>
    this.showTrash() ? this.measurementService.trash() : this.filteredData()
  );

  /** Número de pendientes en el dataset cargado (no depende del estado de filtros). */
  readonly pendingCount = computed(() =>
    this.measurementService.measurements().filter(m => m.status === 'pending_review').length
  );

  /** Estado del atajo "Pendientes": activo cuando filterStatus está fijado a pending_review. */
  readonly pendingOnly = signal(false);

  showOnlyPending(): void {
    this.showTrash.set(false);
    this.filterStatus = 'pending_review';
    this.pendingOnly.set(true);
    this.applyFilters();
  }

  showOnlyDuplicates(): void {
    this.showTrash.set(false);
    this.filterDuplicates = this.filterDuplicates === 'duplicates' ? '' : 'duplicates';
    this.applyFilters();
  }

  toggleViewMode(): void {
    const next = this.viewMode() === 'coverage' ? 'table' : 'coverage';
    this.viewMode.set(next);
    if (next !== 'coverage') return;

    // Cobertura no aplica sobre Papelera.
    this.showTrash.set(false);

    // Defaults inteligentes solo al entrar (no pisan filtros que el usuario ya puso).
    const now = new Date();
    let touched = false;
    if (this.filterYearPreset === '') {
      this.filterYearPreset = now.getFullYear();
      touched = true;
    }
    if (this.filterMonthPreset === '') {
      this.filterMonthPreset = now.getMonth() + 1;
      touched = true;
    }
    if (!this.filterBuilding) {
      const bs = this.buildings();
      if (bs.length === 1) {
        this.filterBuilding = bs[0];
        touched = true;
      }
    }
    if (touched) {
      // Sincroniza las fechas Desde/Hasta con el preset año+mes y reaplica filtros.
      this.onCaptureMonthPresetChange();
    }
  }

  /**
   * Conteo de filas duplicadas calculado sobre TODO el dataset (no depende de filtros activos).
   * Clave: building_name + tower + apartment + YYYY-MM (mismo depto físico mismo mes calendario).
   */
  readonly duplicateCounts = computed(() => {
    const map = new Map<string, number>();
    for (const m of this.measurementService.measurements()) {
      const key = this._duplicateKey(m);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  });

  /** Total de filas que pertenecen a un grupo con 2+ mediciones (cuenta cada repetida individualmente). */
  readonly duplicateRowsCount = computed(() => {
    let n = 0;
    for (const v of this.duplicateCounts().values()) {
      if (v > 1) n += v;
    }
    return n;
  });

  duplicateCountFor(m: Measurement): number {
    return this.duplicateCounts().get(this._duplicateKey(m)) ?? 0;
  }

  monthLabelFor(m: Measurement): string {
    const d = new Date(m.captured_at);
    if (Number.isNaN(d.getTime())) return '—';
    const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  private _duplicateKey(m: Measurement): string {
    const d = new Date(m.captured_at);
    const ym = Number.isNaN(d.getTime())
      ? 'unknown'
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `${m.building_name ?? ''}::${m.tower ?? ''}::${m.apartment ?? ''}::${ym}`;
  }

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
    // Evita apilar cargas si el auto-tick (cada 30s) llega mientras la anterior
    // aún no termina — útil con datasets grandes que tardan varios segundos.
    if (this.loading()) return;
    this.measurementService.loadAll();
    this.measurementService.loadTrash();
  }

  exportMeasurements(format: ExportFormat): void {
    const cleanTower = (t: string | undefined): string =>
      String(t ?? '').replace(/^\s*torre\s+/i, '').trim().toUpperCase();
    const apartmentSortKey = (a: string | undefined): number => {
      const digits = String(a ?? '').replace(/\D/g, '');
      const n = parseInt(digits, 10);
      return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
    };
    const sortedRows = [...this.displayData()].sort((a, b) => {
      // Torre primero (A → B → …); fallback localeCompare por si hay nombres tipo "Norte".
      const tA = cleanTower(a.tower);
      const tB = cleanTower(b.tower);
      if (tA !== tB) return tA.localeCompare(tB);
      // Depto numérico ascendente; fallback string para apartamentos no numéricos.
      const apA = apartmentSortKey(a.apartment);
      const apB = apartmentSortKey(b.apartment);
      if (apA !== apB) return apA - apB;
      return String(a.apartment ?? '').localeCompare(String(b.apartment ?? ''));
    });

    const columns: ExportColumn<Measurement>[] = [
      {
        header: 'Depto',
        key: row => {
          const towerLetter = String(row.tower ?? '').replace(/^\s*torre\s+/i, '').trim();
          return towerLetter ? `${row.apartment}-${towerLetter}` : String(row.apartment ?? '');
        },
        highlight: true,
        numFmt: '@',
      },
      {
        header: 'Lectura',
        key: 'reading_value',
        format: (_v, row) =>
          row.reading_value == null ? '' : formatMeterReadingDisplay(row.reading_value, row.reading_layout),
        highlight: true,
        numFmt: '@',
      },
    ];
    const prefix = this.showTrash() ? 'mediciones_papelera' : 'mediciones';
    const fileName = this.exportService.buildFileName(prefix);
    this.exportService.export(sortedRows, columns, fileName, format, 'Mediciones');
  }

  setTrashMode(v: boolean): void {
    this.showTrash.set(v);
    this.pageIndex.set(0);
    // Salir del atajo "Pendientes" cuando se vuelve a Activas o se va a Papelera.
    if (this.pendingOnly()) {
      this.pendingOnly.set(false);
      if (this.filterStatus === 'pending_review') {
        this.filterStatus = '';
        this.applyFilters();
      }
    }
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

  hasActiveFilters(): boolean {
    return !!(
      this.filterTower ||
      this.filterBuilding ||
      this.filterApartment ||
      this.filterStatus ||
      this.filterDateFrom ||
      this.filterDateTo ||
      this.filterCycle ||
      this.filterDuplicates ||
      this.filterYearPreset !== '' ||
      this.filterMonthPreset !== ''
    );
  }

  photosInDisplayCount(): number {
    return this.displayData().filter(m => !!m.photo_url?.trim()).length;
  }

  /**
   * Etiqueta de período para el ZIP: `2026 Abril` (Año + Mes preset),
   * o el nombre del ciclo seleccionado, o vacío para que el backend infiera.
   */
  private currentPeriodLabel(): string {
    if (this.filterCycle) {
      const c = this.cycleService.cycles().find(x => x.id === this.filterCycle);
      if (c?.name) return c.name;
    }
    if (this.filterYearPreset !== '' && this.filterMonthPreset !== '') {
      const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      return `${this.filterYearPreset} ${months[Number(this.filterMonthPreset) - 1]}`;
    }
    return '';
  }

  async exportPhotosZip(): Promise<void> {
    if (this.exportZipBusy) return;
    const rows = this.displayData();
    const ids = this.photoExport.collectIds(rows);
    if (ids.length === 0) {
      this.notify.info('No hay mediciones con foto en la vista actual.');
      return;
    }
    this.exportZipBusy = true;

    const handle = this.photoExport.buildZipFromIds(ids, this.currentPeriodLabel());
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
      const name = this.exportService.buildFileName('fotos_mediciones');
      this.photoExport.triggerDownload(blob, `${name}.zip`);
      const extra = skipped > 0 ? ` · ${skipped} sin archivo en disco` : '';
      this.notify.success(`${included} foto(s) en el ZIP${extra}`);
    } catch (e: unknown) {
      progressRef.close();
      if (e === ZIP_CANCELLED) {
        this.notify.info('Descarga cancelada');
      } else {
        const msg = e instanceof Error ? e.message : 'No se pudieron empaquetar las fotos';
        this.notify.error(msg);
      }
    } finally {
      this.exportZipBusy = false;
    }
  }

  onCaptureMonthPresetChange(): void {
    if (this.filterYearPreset !== '' && this.filterMonthPreset !== '') {
      const y = Number(this.filterYearPreset);
      const mo = Number(this.filterMonthPreset);
      this.filterDateFromObj = new Date(y, mo - 1, 1);
      this.filterDateToObj = new Date(y, mo, 0);
      this.filterDateFrom = this._formatDate(this.filterDateFromObj);
      this.filterDateTo = this._formatDate(this.filterDateToObj);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    // Si el usuario cambia manualmente el filtro de estado a otra cosa, salir del modo "Pendientes".
    if (this.pendingOnly() && this.filterStatus !== 'pending_review') {
      this.pendingOnly.set(false);
    }
    let result = this.measurementService.getFilteredMeasurements({
      cycleId: this.filterCycle || undefined,
      building: this.filterBuilding || undefined,
      tower: this.filterTower || undefined,
      apartment: this.filterApartment || undefined,
      status: this.filterStatus || undefined,
      dateFrom: this.filterDateFrom || undefined,
      dateTo: this.filterDateTo || undefined,
    });
    if (this.filterDuplicates) {
      const counts = this.duplicateCounts();
      result = result.filter(m => {
        const c = counts.get(this._duplicateKey(m)) ?? 0;
        return this.filterDuplicates === 'duplicates' ? c > 1 : c <= 1;
      });
      // Cuando solo se ven repetidos, agruparlos visualmente: mismo depto+mes adyacente,
      // y dentro de cada grupo, lo más reciente arriba para comparar fácil.
      if (this.filterDuplicates === 'duplicates') {
        result = [...result].sort((a, b) => {
          const ka = this._duplicateKey(a);
          const kb = this._duplicateKey(b);
          if (ka !== kb) return ka.localeCompare(kb);
          return new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime();
        });
      }
    }
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
    this.filterDuplicates = '';
    this.filterYearPreset = '';
    this.filterMonthPreset = '';
    this.pendingOnly.set(false);
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
