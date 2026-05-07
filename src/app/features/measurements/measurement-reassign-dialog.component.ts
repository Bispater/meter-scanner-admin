import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Measurement } from '../../core/models/measurement.model';
import { Apartment, Building, Tower } from '../../core/models/building.model';
import { BuildingService } from '../../core/services/building.service';
import { MeasurementService } from '../../core/services/measurement.service';

export interface MeasurementReassignDialogData {
  measurement: Measurement;
}

@Component({
  selector: 'app-measurement-reassign-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="flex flex-col bg-slate-800 text-slate-200 max-w-[640px] w-[96vw] max-h-[90vh]">
      <div class="flex items-center justify-between px-5 py-3 border-b border-slate-700 shrink-0">
        <h2 class="text-lg font-bold text-white">Reasignar medición a otro depto</h2>
        <button mat-icon-button type="button" (click)="cancel()" [disabled]="busy()" class="cursor-pointer">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <!-- Origen actual -->
        <div class="bg-slate-900 border border-slate-700 rounded-lg p-3 flex gap-3 items-start">
          @if (measurement.photo_url) {
            <img [src]="measurement.photo_url" alt="Foto medición"
                 class="w-20 h-20 object-cover rounded-md shrink-0" />
          }
          <div class="text-xs space-y-0.5 min-w-0">
            <p class="text-[10px] uppercase text-slate-500">Origen actual</p>
            <p class="text-sm font-semibold text-white">
              {{ measurement.building_name || '—' }} · {{ measurement.tower }} · Depto {{ measurement.apartment }}
            </p>
            <p class="text-slate-400">Medidor: <span class="font-mono">{{ measurement.meter_id }}</span></p>
            <p class="text-slate-500 truncate">ID #{{ measurement.id }}</p>
          </div>
        </div>

        <p class="text-xs text-slate-400">
          Selecciona el departamento <strong class="text-slate-300">destino</strong>.
          Quedará registrado en el historial como cambio de <code>apartment</code>.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <mat-form-field appearance="outline" class="dense-reassign w-full">
            <mat-label>Edificio</mat-label>
            <mat-select [(ngModel)]="selectedBuildingId" (ngModelChange)="onBuildingChange()" [disabled]="busy()">
              @for (b of buildings(); track b.id) {
                <mat-option [value]="b.id">{{ b.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-reassign w-full">
            <mat-label>Torre</mat-label>
            <mat-select [(ngModel)]="selectedTowerId" (ngModelChange)="onTowerChange()" [disabled]="busy() || !selectedBuildingId">
              @for (t of towersOfBuilding(); track t.id) {
                <mat-option [value]="t.id">{{ t.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="dense-reassign w-full">
            <mat-label>Depto destino</mat-label>
            <mat-select [(ngModel)]="selectedApartmentId" [disabled]="busy() || !selectedTowerId">
              @for (a of apartmentsOfTower(); track a.id) {
                <mat-option [value]="a.id">{{ a.number }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="dense-reassign w-full">
          <mat-label>Nota (opcional, queda en el historial)</mat-label>
          <input matInput [(ngModel)]="note" [disabled]="busy()" maxlength="500" />
        </mat-form-field>

        @if (preview(); as p) {
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs">
            <p class="text-amber-300 font-semibold">Confirmación</p>
            <p class="text-slate-300 mt-1">
              Mover esta medición de
              <strong class="text-rose-300">{{ p.from }}</strong>
              →
              <strong class="text-emerald-300">{{ p.to }}</strong>.
            </p>
            @if (sameApartment()) {
              <p class="text-rose-300 mt-1">Es el mismo depto: el botón quedará deshabilitado.</p>
            }
          </div>
        }
      </div>

      <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-700 shrink-0">
        <button mat-stroked-button class="!border-slate-600 !text-slate-300" (click)="cancel()" [disabled]="busy()">
          Cancelar
        </button>
        <button mat-flat-button class="!bg-cyan-600 !text-white"
                (click)="confirm()"
                [disabled]="busy() || !canConfirm()">
          @if (busy()) {
            <span class="inline-flex items-center gap-2">
              <mat-icon class="animate-spin" style="font-size:18px;width:18px;height:18px;">progress_activity</mat-icon>
              Reasignando…
            </span>
          } @else {
            <span class="inline-flex items-center gap-1">
              <mat-icon style="font-size:18px;width:18px;height:18px;">swap_horiz</mat-icon>
              Reasignar
            </span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .dense-reassign .mat-mdc-form-field-infix {
        padding-top: 8px !important;
        padding-bottom: 8px !important;
      }
    `,
  ],
})
export class MeasurementReassignDialogComponent {
  private readonly data = inject<MeasurementReassignDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MeasurementReassignDialogComponent, Measurement | undefined>);
  private readonly buildingService = inject(BuildingService);
  private readonly measurementService = inject(MeasurementService);

  readonly measurement = this.data.measurement;
  readonly buildings = this.buildingService.buildings;
  readonly busy = signal(false);

  selectedBuildingId = '';
  selectedTowerId = '';
  selectedApartmentId: string | null = null;
  note = '';

  /** Identifica el apartment_id actual de la medición (para detectar mismo destino). */
  private readonly currentApartmentId = computed<string | null>(() => {
    const m = this.measurement;
    for (const b of this.buildings()) {
      if (b.name !== m.building_name) continue;
      for (const t of b.towers) {
        if (t.name !== m.tower) continue;
        const apt = t.apartments.find(a => a.number === m.apartment);
        if (apt) return apt.id;
      }
    }
    return null;
  });

  readonly towersOfBuilding = computed<Tower[]>(() => {
    const b = this.buildings().find(x => x.id === this.selectedBuildingId);
    return b ? b.towers : [];
  });

  readonly apartmentsOfTower = computed<Apartment[]>(() => {
    const t = this.towersOfBuilding().find(x => x.id === this.selectedTowerId);
    if (!t) return [];
    return [...t.apartments].sort((a, b) => {
      const na = parseInt(a.number.replace(/\D/g, ''), 10);
      const nb = parseInt(b.number.replace(/\D/g, ''), 10);
      if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
      return a.number.localeCompare(b.number);
    });
  });

  readonly preview = computed(() => {
    const aptId = this.selectedApartmentId;
    if (!aptId) return null;
    const b = this.buildings().find(x => x.id === this.selectedBuildingId);
    const t = b?.towers.find(x => x.id === this.selectedTowerId);
    const a = t?.apartments.find(x => x.id === aptId);
    if (!b || !t || !a) return null;
    return {
      from: `${this.measurement.building_name} · ${this.measurement.tower} · ${this.measurement.apartment}`,
      to: `${b.name} · ${t.name} · ${a.number}`,
    };
  });

  readonly sameApartment = computed(() =>
    !!this.selectedApartmentId && this.selectedApartmentId === this.currentApartmentId(),
  );

  constructor() {
    // Default: mismo edificio + misma torre que el origen, depto vacío para que el admin elija.
    const m = this.measurement;
    const b = this.buildings().find(x => x.name === m.building_name);
    if (b) {
      this.selectedBuildingId = b.id;
      const t = b.towers.find(x => x.name === m.tower);
      if (t) this.selectedTowerId = t.id;
    }
  }

  onBuildingChange(): void {
    this.selectedTowerId = '';
    this.selectedApartmentId = null;
  }

  onTowerChange(): void {
    this.selectedApartmentId = null;
  }

  canConfirm(): boolean {
    return !!this.selectedApartmentId && !this.sameApartment();
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  async confirm(): Promise<void> {
    if (!this.canConfirm() || this.busy()) return;
    const aptId = this.selectedApartmentId!;
    const numericId = parseInt(String(aptId), 10);
    if (!Number.isFinite(numericId)) return;
    this.busy.set(true);
    const updated = await this.measurementService.reassignMeasurement(
      this.measurement.id,
      numericId,
      this.note,
    );
    this.busy.set(false);
    if (updated) this.dialogRef.close(updated);
  }
}
