import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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
import { MeasurementCoverageComponent } from './measurement-coverage.component';
import { MeasurementExportDialogComponent, MeasurementExportDialogData } from './measurement-export-dialog.component';
import { BuildingService } from '../../core/services/building.service';
import { buildPeriodOptions, parsePeriodKey, periodKey, periodLabel } from '../../shared/utils/period-options.util';

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
    MatProgressSpinnerModule,
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
                  (click)="openExportDialog()"
                  matTooltip="Exportar un ciclo o un mes a planilla, CSV o ZIP de fotos (no depende de la tabla)">
            <mat-icon>download</mat-icon> Exportar
          </button>
          <button mat-flat-button
                  class="!bg-cyan-600 !text-white cursor-pointer"
                  (click)="refresh()"
                  [disabled]="loading()"
                  [matTooltip]="loading() ? 'Sincronizando con el servidor…' : 'Actualizar datos ahora'">
            <mat-icon [class.animate-spin]="loading()">{{ loading() ? 'progress_activity' : 'refresh' }}</mat-icon>
            <span>{{ loading() ? 'Actualizando…' : 'Actualizar' }}</span>
          </button>
          <button mat-stroked-button
                  [class]="autoRefreshSecs() > 0 ? '!border-cyan-500/60 !text-cyan-300' : '!border-slate-600 !text-slate-300'"
                  class="cursor-pointer"
                  [matMenuTriggerFor]="autoRefreshMenu"
                  matTooltip="Programar actualización automática (desactivada por defecto)">
            <mat-icon>schedule</mat-icon> {{ autoRefreshLabel() }}
          </button>
          <mat-menu #autoRefreshMenu="matMenu">
            <button mat-menu-item (click)="setAutoRefresh(0)">
              <mat-icon>block</mat-icon><span>Desactivada (por defecto)</span>
            </button>
            <button mat-menu-item (click)="setAutoRefresh(30)">
              <mat-icon>schedule</mat-icon><span>Cada 30 segundos</span>
            </button>
            <button mat-menu-item (click)="setAutoRefresh(60)">
              <mat-icon>schedule</mat-icon><span>Cada 1 minuto</span>
            </button>
            <button mat-menu-item (click)="setAutoRefresh(300)">
              <mat-icon>schedule</mat-icon><span>Cada 5 minutos</span>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Filters -->
      @if (!showTrash()) {
      <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <div class="flex items-center gap-2 mb-4">
          <mat-icon class="text-slate-400" style="font-size:18px;width:18px;height:18px;">filter_list</mat-icon>
          <span class="text-sm font-semibold text-slate-300">Filtros</span>
        </div>
        <!-- Fila principal: período o ciclo → trae del servidor; el resto refina en el navegador -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 items-start">
          <mat-form-field appearance="outline" class="dense-field w-full sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <mat-label>Período (mes de captura)</mat-label>
            <mat-select [(ngModel)]="filterPeriod" (ngModelChange)="onPeriodChange()">
              @for (p of periodOptions(); track p.value) {
                <mat-option [value]="p.value">{{ p.label }}{{ p.value === currentPeriodKey ? ' · actual' : '' }}</mat-option>
              }
              <mat-option value="all">Todo el histórico (lento)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full"
                          matTooltip="Un ciclo muestra solo las mediciones asignadas a él y reemplaza al período">
            <mat-label>Ciclo</mat-label>
            <mat-select [(ngModel)]="filterCycle" (ngModelChange)="onCycleFilterChange($event)">
              <mat-option value="">— Por período —</mat-option>
              @for (c of cycleService.cycles(); track c.id) {
                <mat-option [value]="c.id">{{ c.name }} — {{ c.building_name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Edificio</mat-label>
            <mat-select [(ngModel)]="filterBuilding" (ngModelChange)="onBuildingFilterChange()">
              <mat-option value="">Todos</mat-option>
              @for (b of buildingOptions(); track b) {
                <mat-option [value]="b">{{ b }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Torre</mat-label>
            <mat-select [(ngModel)]="filterTower" (ngModelChange)="applyFilters()">
              <mat-option value="">Todas</mat-option>
              @for (t of towerOptions(); track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-field w-full">
            <mat-label>Departamento</mat-label>
            <input matInput [(ngModel)]="filterApartment" (ngModelChange)="applyFilters()" placeholder="Ej: 1409" />
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
        </div>

        <div class="flex flex-wrap items-center gap-3 mt-3">
          <button mat-stroked-button
                  [class]="showAdvancedFilters() ? '!border-cyan-500/60 !text-cyan-300' : '!border-slate-600 !text-slate-300'"
                  (click)="showAdvancedFilters.set(!showAdvancedFilters())">
            <mat-icon>{{ showAdvancedFilters() ? 'expand_less' : 'tune' }}</mat-icon>
            Más filtros{{ advancedFilterCount() > 0 ? ' (' + advancedFilterCount() + ')' : '' }}
          </button>
          @if (hasActiveFilters()) {
            <button mat-stroked-button class="!border-slate-600 !text-slate-400" (click)="clearFilters()">
              <mat-icon>clear</mat-icon> Limpiar filtros
            </button>
          }
          <p class="text-xs text-slate-500 m-0 max-w-2xl">
            Elige un <strong class="text-slate-400">período</strong> o un <strong class="text-slate-400">ciclo</strong>
            y la tabla se actualiza sola. Edificio, torre, depto y estado refinan lo cargado.
            Para descargar usa <strong class="text-slate-400">«Exportar»</strong>: no depende de estos filtros.
          </p>
        </div>

        @if (showAdvancedFilters()) {
        <div class="mt-4 pt-4 border-t border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
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
        </div>
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
        <div class="overflow-x-auto transition-opacity" [class.opacity-50]="loading()" [class.pointer-events-none]="loading()">
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

        @if (loading() && displayData().length === 0) {
          <div class="py-16 flex flex-col items-center gap-4">
            <mat-spinner diameter="44"></mat-spinner>
            <p class="text-slate-400 text-sm">Cargando mediciones…</p>
          </div>
        } @else if (displayData().length === 0) {
          <div class="py-16 text-center">
            <mat-icon class="text-slate-600" style="font-size:48px;width:48px;height:48px;">
              {{ showTrash() || hasLoadedScope() ? 'search_off' : 'filter_alt' }}
            </mat-icon>
            <p class="text-slate-400 mt-3">
              @if (showTrash()) {
                La papelera está vacía.
              } @else if (!hasLoadedScope()) {
                Elige un <strong class="text-slate-300">período</strong> o un
                <strong class="text-slate-300">ciclo</strong>, o usa
                <strong class="text-amber-300">«Pendientes»</strong> para cargar mediciones.
              } @else {
                No hay mediciones {{ loadedScopeLabel() }}{{ hasRefiningFilters() ? ' con los filtros aplicados' : '' }}.
                Prueba con otro período o ciclo.
              }
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
    /* Sin espacio de subscript (errores/hints): permite centrar verticalmente
       los botones junto a los selects en la fila de búsqueda. */
    ::ng-deep .dense-field .mat-mdc-form-field-subscript-wrapper {
      display: none !important;
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
  private readonly buildingService = inject(BuildingService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  /** Clave `YYYY-MM` del mes en curso: período por defecto al entrar y al limpiar filtros. */
  readonly currentPeriodKey = periodKey(new Date().getFullYear(), new Date().getMonth() + 1);

  /** Opciones del selector «Período»: últimos 24 meses + meses con ciclos registrados. */
  readonly periodOptions = computed(() => buildPeriodOptions(this.cycleService.cycles()));

  /**
   * Período elegido: `YYYY-MM` (un mes, lo habitual), `'all'` (todo el histórico,
   * explícito) o `''` (sin período, p. ej. cuando el ciclo es la fuente de datos).
   */
  filterPeriod = '';

  /** Año/mes derivados del período (los usa la vista de cobertura y el rango de fechas). */
  get filterYearPreset(): number | '' { return parsePeriodKey(this.filterPeriod)?.year ?? ''; }
  get filterMonthPreset(): number | '' { return parsePeriodKey(this.filterPeriod)?.month ?? ''; }

  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private _dialogOpen = false;
  private _offLoaded: (() => void) | null = null;

  /**
   * Edificios para el filtro: los del catálogo (disponibles aunque la tabla esté
   * vacía) más cualquier nombre presente en las filas cargadas.
   */
  readonly buildingOptions = computed(() => {
    const names = new Set<string>(this.buildingService.buildings().map(b => b.name));
    for (const b of this.measurementService.buildings()) if (b) names.add(b);
    return [...names].sort((a, b) => a.localeCompare(b));
  });

  /** Torres del edificio elegido (o de todos): del catálogo más las filas cargadas. */
  towerOptions(): string[] {
    const selected = this.filterBuilding;
    const names = new Set<string>();
    for (const b of this.buildingService.buildings()) {
      if (selected && b.name !== selected) continue;
      for (const t of b.towers) names.add(t.name);
    }
    for (const m of this.measurementService.measurements()) {
      if (selected && m.building_name !== selected) continue;
      if (m.tower) names.add(m.tower);
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }

  /** Al cambiar de edificio, una torre que no le pertenece deja de tener sentido. */
  onBuildingFilterChange(): void {
    if (this.filterTower && !this.towerOptions().includes(this.filterTower)) this.filterTower = '';
    this.applyFilters();
  }
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

  /**
   * Número de pendientes GLOBAL (del endpoint de resumen del Dashboard), con
   * fallback al dataset cargado si el resumen aún no llega.
   */
  readonly pendingCount = computed(() => {
    const summary = this.measurementService.dashboardSummary();
    if (summary) return summary.statusCounts.pending_review;
    return this.measurementService.measurements().filter(m => m.status === 'pending_review').length;
  });

  /** True si hay algún dataset cargado (para distinguir "sin filtro" de "sin resultados"). */
  readonly hasLoadedScope = computed(() => this.measurementService.scope() !== null);

  /** Estado del atajo "Pendientes": activo cuando filterStatus está fijado a pending_review. */
  readonly pendingOnly = signal(false);

  /** Panel «Más filtros» (duplicados y fechas manuales) plegado por defecto. */
  readonly showAdvancedFilters = signal(false);

  /** Cuántos filtros del panel plegado están activos (badge del botón «Más filtros»). */
  advancedFilterCount(): number {
    let n = 0;
    if (this.filterDuplicates) n++;
    if (this._hasCustomDateRange()) n++;
    return n;
  }

  /**
   * True si «Desde»/«Hasta» difieren del rango que se sincroniza automáticamente
   * con el período (ese rango no cuenta como filtro "extra" del usuario).
   */
  private _hasCustomDateRange(): boolean {
    if (!this.filterDateFrom && !this.filterDateTo) return false;
    const p = parsePeriodKey(this.filterPeriod);
    if (!p) return true;
    return !(
      this.filterDateFrom === this._formatDate(new Date(p.year, p.month - 1, 1)) &&
      this.filterDateTo === this._formatDate(new Date(p.year, p.month, 0))
    );
  }

  showOnlyPending(): void {
    this.showTrash.set(false);
    this.filterStatus = 'pending_review';
    this.pendingOnly.set(true);
    // Trae del servidor SOLO las pendientes (histórico completo) — no requiere
    // haber cargado un mes antes. Limpia período/ciclo para no acotar.
    this.filterPeriod = '';
    this.filterCycle = '';
    this._clearDateRange();
    if (this.measurementService.scope()?.kind !== 'pending') {
      this.measurementService.loadPending();
    }
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

    // Defaults inteligentes solo al entrar (no pisan filtros que el usuario ya puso;
    // si hay un ciclo elegido, ese manda y no se fuerza el período).
    let touched = false;
    if (!this.filterCycle && !parsePeriodKey(this.filterPeriod)) {
      this.filterPeriod = this.currentPeriodKey;
      touched = true;
    }
    if (!this.filterBuilding) {
      const bs = this.buildingOptions();
      if (bs.length === 1) {
        this.filterBuilding = bs[0];
        touched = true;
      }
    }
    if (touched) {
      // Sincroniza las fechas Desde/Hasta con el período y reaplica filtros.
      this.onPeriodChange();
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
    // Al entrar se carga solo el mes en curso (una petición liviana). Si se vuelve
    // a esta pantalla con un dataset ya cargado, se refleja ese alcance en los selectores.
    this._offLoaded = this.measurementService.onLoaded(() => this.applyFilters());

    const scope = this.measurementService.scope();
    if (scope?.kind === 'month') {
      this.filterPeriod = periodKey(scope.year, scope.month);
      this._syncDateRangeToPreset();
    } else if (scope?.kind === 'all') {
      this.filterPeriod = 'all';
    } else if (scope?.kind === 'cycle') {
      this.filterCycle = scope.cycleId;
    } else if (scope?.kind === 'pending') {
      this.filterStatus = 'pending_review';
      this.pendingOnly.set(true);
    }
    if (scope) this.applyFilters();

    if (!scope) {
      if (this.route.snapshot.queryParamMap.get('status') === 'pending') {
        // Atajo desde el Dashboard: tarjeta «Pendientes» → /app/measurements?status=pending
        this.showOnlyPending();
      } else {
        // Primera visita: mes en curso por defecto, para ver datos de inmediato
        // en vez de una tabla vacía que obliga a buscar antes de hacer nada.
        this.filterPeriod = this.currentPeriodKey;
        this.onPeriodChange(false);
      }
    }

    // Sin actualización automática por defecto: solo manual (botón «Actualizar»)
    // o programada si el usuario la activa desde el menú «Auto».
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this._offLoaded?.();
  }

  /** Intervalo de actualización automática en segundos (0 = desactivada, el defecto). */
  readonly autoRefreshSecs = signal(0);

  autoRefreshLabel(): string {
    const s = this.autoRefreshSecs();
    if (s === 0) return 'Auto: off';
    return s < 60 ? `Auto: ${s}s` : `Auto: ${s / 60}m`;
  }

  /** Activa/desactiva la recarga programada. Solo recarga lo ya cargado (reload es no-op sin alcance). */
  setAutoRefresh(secs: number): void {
    this.autoRefreshSecs.set(secs);
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (secs > 0) {
      this.refreshInterval = setInterval(() => this.refresh(), secs * 1000);
      this.notify.info(`Actualización automática cada ${this.autoRefreshLabel().replace('Auto: ', '')}.`);
    } else {
      this.notify.info('Actualización automática desactivada.');
    }
  }

  refresh(): void {
    // Evita apilar cargas si un tick programado llega mientras la anterior
    // aún no termina — útil con datasets grandes que tardan varios segundos.
    if (this.loading()) return;
    if (this.showTrash()) {
      // En la papelera solo interesa refrescar la papelera.
      this.measurementService.loadTrash();
      return;
    }
    // Recarga respetando el alcance actual (mes/ciclo/pendientes); sin alcance no hace nada.
    this.measurementService.reload();
  }

  /**
   * Abre el diálogo de exportación. Permite elegir un ciclo o un mes (pidiéndolo
   * al servidor) sin depender de lo que muestra la tabla; también ofrece «lo que
   * ves» (filas visibles) para casos puntuales como duplicados o la papelera.
   */
  openExportDialog(): void {
    const data: MeasurementExportDialogData = {
      visibleRows: this.displayData(),
      visibleLabel: this.showTrash() ? 'Papelera' : 'Tabla actual',
      cycleId: this.filterCycle || undefined,
      period: parsePeriodKey(this.filterPeriod) ? this.filterPeriod : undefined,
    };
    this.dialog.open(MeasurementExportDialogComponent, {
      data,
      panelClass: 'dark-dialog',
      width: '96vw',
      maxWidth: '640px',
      autoFocus: false,
    });
  }

  setTrashMode(v: boolean): void {
    this.showTrash.set(v);
    this.pageIndex.set(0);
    // Salir del atajo "Pendientes" cuando se vuelve a Activas o se va a Papelera.
    if (this.pendingOnly()) {
      this.pendingOnly.set(false);
      if (this.filterStatus === 'pending_review') {
        this.filterStatus = '';
      }
      // El dataset cargado era "solo pendientes": al volver a Activas se vacía la
      // tabla y se pide elegir un filtro (mes+año o ciclo) para cargar datos.
      if (!v && this.measurementService.scope()?.kind === 'pending') {
        this.measurementService.clear();
      }
      this.applyFilters();
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

  /** True si hay algo distinto del estado por defecto (mes en curso, sin refinar). */
  hasActiveFilters(): boolean {
    return this.hasRefiningFilters() || this.filterPeriod !== this.currentPeriodKey;
  }

  /** Filtros que refinan el dataset cargado en el navegador (no cambian qué se pide al servidor). */
  hasRefiningFilters(): boolean {
    return !!(
      this.filterTower ||
      this.filterBuilding ||
      this.filterApartment ||
      this.filterStatus ||
      this.filterDuplicates ||
      this._hasCustomDateRange()
    );
  }

  /** «en Octubre 2026» / «en el ciclo X» / «pendientes», según el alcance cargado. */
  loadedScopeLabel(): string {
    const s = this.measurementService.scope();
    if (!s) return '';
    switch (s.kind) {
      case 'month': return `en ${periodLabel(s.year, s.month)}`;
      case 'cycle': {
        const c = this.cycleService.cycles().find(x => x.id === s.cycleId);
        return c ? `en el ciclo ${c.name}` : 'en el ciclo seleccionado';
      }
      case 'pending': return 'pendientes';
      case 'all': return 'en el histórico';
    }
  }

  /**
   * Cambio de «Período»: un mes concreto trae SOLO ese mes del servidor; «all»
   * trae el histórico completo (explícito); vacío deja el ciclo como fuente de
   * datos si hay uno, o limpia la tabla. `announce` muestra el resultado en un snackbar.
   */
  onPeriodChange(announce = true): void {
    const p = parsePeriodKey(this.filterPeriod);
    if (p) {
      this._syncDateRangeToPreset();
      // Elegir un mes desactiva el ciclo como fuente de datos.
      if (this.filterCycle) this.filterCycle = '';
      const s = this.measurementService.scope();
      // Evita refetch redundante si ya está cargado ese mes.
      if (!(s?.kind === 'month' && s.year === p.year && s.month === p.month)) {
        if (announce) this._announceResultsOnce(this._periodLabel(p.year, p.month));
        this.measurementService.loadMonth(p.year, p.month);
      }
    } else {
      this._clearDateRange();
      if (this.filterPeriod === 'all') {
        if (this.filterCycle) this.filterCycle = '';
        if (this.measurementService.scope()?.kind !== 'all') {
          if (announce) this._announceResultsOnce('todo el histórico');
          this.measurementService.loadAll();
        }
      } else if (this.filterCycle) {
        this._loadCycleIfNeeded(this.filterCycle, announce);
      } else {
        this.measurementService.clear();
      }
    }
    this.applyFilters();
  }

  /** «Julio 2026» a partir de año + mes (1-12). */
  private _periodLabel(year: number, month: number): string {
    return periodLabel(year, month);
  }

  /**
   * Snackbar con el resultado de la PRÓXIMA carga que termine: cuántas filas
   * llegaron para el período y cuántas quedan visibles tras los demás filtros.
   * Se auto-desregistra (y expira a los 30 s si la carga falló y nunca llegó).
   */
  private _announceResultsOnce(label: string): void {
    let off: () => void = () => {};
    const timer = setTimeout(() => off(), 30000);
    off = this.measurementService.onLoaded(() => {
      clearTimeout(timer);
      off();
      const total = this.measurementService.measurements().length;
      const visible = this.displayData().length;
      if (total === 0) {
        this.notify.info(`No hay mediciones para ${label}.`);
      } else if (visible !== total) {
        this.notify.success(`${total} mediciones para ${label} · ${visible} visibles con los filtros actuales.`);
      } else {
        this.notify.success(`${total} ${total === 1 ? 'medición encontrada' : 'mediciones encontradas'} para ${label}.`);
      }
    });
  }

  /** Carga el ciclo si no es ya el alcance actual. Devuelve true si disparó una carga. */
  private _loadCycleIfNeeded(cycleId: string, announce = false): boolean {
    const s = this.measurementService.scope();
    if (s?.kind === 'cycle' && s.cycleId === cycleId) return false;
    if (announce) {
      const c = this.cycleService.cycles().find(x => x.id === cycleId);
      this._announceResultsOnce(c ? `el ciclo ${c.name}` : 'el ciclo seleccionado');
    }
    this.measurementService.loadCycle(cycleId);
    return true;
  }

  /** Ajusta «Desde»/«Hasta» al mes+año seleccionado (acotado dentro del mes cargado). */
  private _syncDateRangeToPreset(): void {
    if (this.filterYearPreset === '' || this.filterMonthPreset === '') return;
    const y = Number(this.filterYearPreset);
    const mo = Number(this.filterMonthPreset);
    this.filterDateFromObj = new Date(y, mo - 1, 1);
    this.filterDateToObj = new Date(y, mo, 0);
    this.filterDateFrom = this._formatDate(this.filterDateFromObj);
    this.filterDateTo = this._formatDate(this.filterDateToObj);
  }

  private _clearDateRange(): void {
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.filterDateFromObj = null;
    this.filterDateToObj = null;
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

  onCycleFilterChange(cycleId: string): void {
    if (cycleId) {
      // El ciclo pasa a ser la fuente de datos (filtro en servidor): se limpian
      // el período y el rango de fechas derivado.
      this.filterPeriod = '';
      this._clearDateRange();
      this._loadCycleIfNeeded(cycleId, true);
      this.applyFilters();
      return;
    }
    // Se quitó el ciclo: volver al período elegido, o al mes en curso si no había.
    if (!parsePeriodKey(this.filterPeriod) && this.filterPeriod !== 'all') {
      this.filterPeriod = this.currentPeriodKey;
    }
    this.onPeriodChange();
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
    this.filterCycle = '';
    this.filterDuplicates = '';
    this._clearDateRange();
    this.pendingOnly.set(false);
    // «Limpiar» vuelve al estado por defecto: el mes en curso, sin refinar.
    this.filterPeriod = this.currentPeriodKey;
    this.onPeriodChange(false);
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
