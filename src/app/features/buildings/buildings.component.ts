import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BuildingService } from '../../core/services/building.service';
import { UserService } from '../../core/services/user.service';
import { QrService } from '../../core/services/qr.service';
import { Building, Tower, Apartment, ReadingLayout } from '../../core/models/building.model';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule, MatExpansionModule, MatTooltipModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Edificios</h2>
          <p class="text-slate-400 text-sm mt-1">Gestionar edificios, torres y departamentos</p>
        </div>
        <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold" (click)="openAddBuilding()">
          <mat-icon>add_business</mat-icon> Nuevo Edificio
        </button>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <mat-icon class="text-cyan-400" style="font-size:20px;width:20px;height:20px;">domain</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ buildingService.buildings().length }}</p>
              <p class="text-xs text-slate-400">Edificios</p>
            </div>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <mat-icon class="text-indigo-400" style="font-size:20px;width:20px;height:20px;">apartment</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ buildingService.allTowers().length }}</p>
              <p class="text-xs text-slate-400">Torres</p>
            </div>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <mat-icon class="text-green-400" style="font-size:20px;width:20px;height:20px;">door_front</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ buildingService.allApartments().length }}</p>
              <p class="text-xs text-slate-400">Departamentos</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Building cards -->
      @for (building of buildingService.buildings(); track building.id) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <!-- Building header -->
          <div class="flex items-center justify-between p-5 border-b border-slate-700">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <mat-icon class="text-cyan-400" style="font-size:22px;width:22px;height:22px;">domain</mat-icon>
              </div>
              <div>
                <h3 class="text-lg font-bold text-white">{{ building.name }}</h3>
                <p class="text-xs text-slate-400">{{ building.address }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-slate-500 mr-3">{{ building.towers.length }} torres · {{ countApts(building) }} dptos</span>
              <button type="button" class="inline-flex items-center justify-center w-9 h-9 rounded-full text-cyan-400 hover:bg-cyan-400/10 transition-colors" (click)="openAddTower(building)">
                <mat-icon style="font-size:20px;width:20px;height:20px;line-height:1;">add</mat-icon>
              </button>
              <button type="button" class="inline-flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" (click)="deleteBuilding(building)">
                <mat-icon style="font-size:18px;width:18px;height:18px;line-height:1;">delete_outline</mat-icon>
              </button>
            </div>
          </div>

          <!-- Towers -->
          @for (tower of building.towers; track tower.id) {
            <div class="border-b border-slate-700/50 last:border-b-0">
              <div class="flex items-center justify-between px-5 py-3 bg-slate-800/50">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-indigo-400" style="font-size:18px;width:18px;height:18px;">apartment</mat-icon>
                  <span class="text-sm font-semibold text-slate-200">{{ tower.name }}</span>
                  <span class="text-xs text-slate-500">({{ tower.apartments.length }} dptos)</span>
                </div>
                <div class="flex items-center gap-1">
                  <button type="button" class="inline-flex items-center justify-center h-7 px-2 rounded-md text-xs font-medium text-violet-400 hover:bg-violet-400/10 transition-colors gap-1" (click)="openBulkAddApartments(building, tower)" matTooltip="Agregar múltiples departamentos">
                    <mat-icon style="font-size:14px;width:14px;height:14px;line-height:1;">playlist_add</mat-icon>
                    Masivo
                  </button>
                  <button type="button" class="inline-flex items-center justify-center w-8 h-8 rounded-full text-cyan-400 hover:bg-cyan-400/10 transition-colors" (click)="openAddApartment(building, tower)">
                    <mat-icon style="font-size:18px;width:18px;height:18px;line-height:1;">add</mat-icon>
                  </button>
                  <button type="button" class="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors" (click)="deleteTower(building, tower)">
                    <mat-icon style="font-size:16px;width:16px;height:16px;line-height:1;">delete_outline</mat-icon>
                  </button>
                </div>
              </div>

              <!-- Apartments grid -->
              @if (tower.apartments.length > 0) {
                <div class="px-5 py-3 flex flex-wrap gap-2">
                  @for (apt of tower.apartments; track apt.id) {
                    <div class="bg-slate-700/50 rounded-lg px-3 py-2 text-xs flex items-center gap-2 group">
                      <mat-icon class="text-green-400" style="font-size:14px;width:14px;height:14px;">door_front</mat-icon>
                      <span class="text-slate-300 font-medium">{{ apt.number }}</span>
                      <span class="text-slate-500">P{{ apt.floor }}</span>
                      <span class="text-slate-500">·</span>
                      <span class="text-slate-500">{{ apt.meterId }}</span>
                      <span class="text-slate-600 font-mono" matTooltip="Tipo de medidor">{{ apt.readingLayout }}</span>
                      <span class="text-xs px-1 rounded" [class]="getOperatorForApt(apt.id) ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'">
                        {{ getOperatorForApt(apt.id) || 'Sin asignar' }}
                      </span>
                      <button type="button" class="text-slate-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              (click)="openEditApartment(building, tower, apt); $event.stopPropagation()">
                        <mat-icon style="font-size:14px;width:14px;height:14px;">edit</mat-icon>
                      </button>
                      <button type="button" class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              (click)="deleteApartment(building, tower, apt)">
                        <mat-icon style="font-size:14px;width:14px;height:14px;">close</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              }
            </div>
          }

          @if (building.towers.length === 0) {
            <div class="p-8 text-center text-slate-500 text-sm">
              Sin torres. Haz clic en <mat-icon class="text-cyan-400 align-text-bottom" style="font-size:16px;width:16px;height:16px;">add</mat-icon> para agregar una.
            </div>
          }
        </div>
      }

      @if (buildingService.buildings().length === 0) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <mat-icon class="text-slate-600" style="font-size:48px;width:48px;height:48px;">domain_disabled</mat-icon>
          <p class="text-slate-400 mt-3">No hay edificios registrados.</p>
        </div>
      }
    </div>
  `,
})
export class BuildingsComponent {
  readonly buildingService = inject(BuildingService);
  private readonly userService = inject(UserService);
  private readonly qrService = inject(QrService);
  private readonly dialog = inject(MatDialog);

  countApts(building: Building): number {
    return building.towers.reduce((sum, t) => sum + t.apartments.length, 0);
  }

  getOperatorForApt(aptId: string): string | null {
    const users = this.userService.getUsersByApartment(aptId);
    if (users.length === 0) return null;
    return users.map(u => u.displayName.split(' ')[0]).join(', ');
  }

  deleteBuilding(building: Building): void {
    this.buildingService.deleteBuilding(building.id);
  }

  deleteTower(building: Building, tower: Tower): void {
    this.buildingService.deleteTower(building.id, tower.id);
  }

  deleteApartment(building: Building, tower: Tower, apt: Apartment): void {
    this.buildingService.deleteApartment(building.id, tower.id, apt.id);
  }

  openAddBuilding(): void {
    const ref = this.dialog.open(BuildingFormDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: { type: 'building' },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.buildingService.addBuilding(result.name, result.address);
    });
  }

  openAddTower(building: Building): void {
    const ref = this.dialog.open(BuildingFormDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: { type: 'tower', buildingName: building.name },
    });
    ref.afterClosed().subscribe(result => {
      if (result) this.buildingService.addTower(building.id, result.name);
    });
  }

  openAddApartment(building: Building, tower: Tower): void {
    const ref = this.dialog.open(BuildingFormDialogComponent, {
      width: '450px',
      panelClass: 'dark-dialog',
      data: { type: 'apartment', buildingName: building.name, towerName: tower.name },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.buildingService.addApartment(building.id, tower.id, {
        number: result.number,
        meterId: result.meterId,
        floor: result.floor,
        readingLayout: result.readingLayout as ReadingLayout,
      }).subscribe((res: unknown) => {
        const created = res as { id?: number };
        void this.qrService.addQr(
          tower.name,
          result.number,
          result.meterId,
          result.readingLayout as 'A' | 'B',
          created?.id != null ? +created.id : undefined,
        );
      });
    });
  }

  openEditApartment(building: Building, tower: Tower, apt: Apartment): void {
    const ref = this.dialog.open(EditApartmentDialogComponent, {
      width: '480px',
      panelClass: 'dark-dialog',
      data: { apartment: apt, towerName: tower.name, buildingName: building.name },
    });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.buildingService.updateApartment(apt.id, {
        number: result.number,
        meterId: result.meterId,
        readingLayout: result.readingLayout as ReadingLayout,
      });
    });
  }

  openBulkAddApartments(building: Building, tower: Tower): void {
    const ref = this.dialog.open(BulkApartmentDialogComponent, {
      width: '720px',
      panelClass: 'dark-dialog',
      data: { buildingName: building.name, towerName: tower.name },
    });
    ref.afterClosed().subscribe(async (apartments: Omit<Apartment, 'id'>[] | undefined) => {
      if (!apartments?.length) return;
      await this.buildingService.bulkAddApartments(tower.id, apartments);
      for (const apt of apartments) {
        await this.qrService.addQr(tower.name, apt.number, apt.meterId, apt.readingLayout);
      }
    });
  }
}

/* ─── Reusable Form Dialog for Building / Tower / Apartment ─── */
@Component({
  selector: 'app-building-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-white">
      @switch (data.type) {
        @case ('building') { Nuevo Edificio }
        @case ('tower') { Nueva Torre — {{ data.buildingName }} }
        @case ('apartment') { Nuevo Depto — {{ data.buildingName }} · {{ data.towerName }} }
      }
    </h2>
    <mat-dialog-content class="!pt-2 space-y-4">
      @switch (data.type) {
        @case ('building') {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre del Edificio</mat-label>
            <input matInput [(ngModel)]="form.name" placeholder="Ej: Edificio Los Robles" />
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Dirección</mat-label>
            <input matInput [(ngModel)]="form.address" placeholder="Ej: Av. Providencia 1234" />
          </mat-form-field>
        }
        @case ('tower') {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre de la Torre</mat-label>
            <input matInput [(ngModel)]="form.name" placeholder="Ej: Torre A" />
          </mat-form-field>
        }
        @case ('apartment') {
          <div class="grid grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Número de Depto</mat-label>
              <input matInput [(ngModel)]="form.number" placeholder="Ej: 101" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Piso</mat-label>
              <input matInput [(ngModel)]="form.floor" type="number" placeholder="Ej: 1" />
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>ID Medidor</mat-label>
            <input matInput [(ngModel)]="form.meterId" placeholder="Ej: 621659-11" />
          </mat-form-field>
          <div>
            <p class="text-xs text-slate-400 mb-2">Tipo de medidor</p>
            <div class="grid grid-cols-2 gap-3">
              <button type="button"
                      class="flex flex-col items-stretch rounded-xl border-2 p-2 transition-colors bg-slate-800/50 hover:bg-slate-700/50 text-left"
                      [class.border-cyan-400]="form.readingLayout === 'A'"
                      [class.border-slate-600]="form.readingLayout !== 'A'"
                      (click)="form.readingLayout = 'A'">
                <img src="assets/meter-types/type_A.png" alt="Referencia medidor tipo A"
                     class="h-28 w-full object-contain rounded-lg bg-slate-900/40" />
                <span class="mt-2 text-sm font-medium text-center text-slate-200">Tipo A</span>
              </button>
              <button type="button"
                      class="flex flex-col items-stretch rounded-xl border-2 p-2 transition-colors bg-slate-800/50 hover:bg-slate-700/50 text-left"
                      [class.border-cyan-400]="form.readingLayout === 'B'"
                      [class.border-slate-600]="form.readingLayout !== 'B'"
                      (click)="form.readingLayout = 'B'">
                <img src="assets/meter-types/type_B.png" alt="Referencia medidor tipo B"
                     class="h-28 w-full object-contain rounded-lg bg-slate-900/40" />
                <span class="mt-2 text-sm font-medium text-center text-slate-200">Tipo B</span>
              </button>
            </div>
            <button mat-stroked-button type="button"
                    class="!mt-2 !border-slate-600 !text-slate-300"
                    (click)="openTypePreview(form.readingLayout)">
              <mat-icon>zoom_in</mat-icon>
              Ver imagen en grande
            </button>
          </div>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400">Cancelar</button>
      <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold"
              [disabled]="!isValid()"
              [mat-dialog-close]="form">
        <mat-icon>add</mat-icon> Agregar
      </button>
    </mat-dialog-actions>
  `,
})
export class BuildingFormDialogComponent {
  readonly data = inject<{
    type: 'building' | 'tower' | 'apartment';
    buildingName?: string;
    towerName?: string;
  }>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);

  form: any = {
    name: '',
    address: '',
    number: '',
    floor: 1,
    meterId: '',
    readingLayout: 'A',
  };

  isValid(): boolean {
    switch (this.data.type) {
      case 'building': return !!(this.form.name && this.form.address);
      case 'tower': return !!this.form.name;
      case 'apartment': return !!(this.form.number && this.form.meterId && this.form.readingLayout);
    }
  }

  openTypePreview(type: ReadingLayout): void {
    this.dialog.open(MeterTypePreviewDialogComponent, {
      width: 'min(95vw, 720px)',
      panelClass: 'dark-dialog',
      data: { type },
    });
  }
}

/* ─── Bulk Apartment Dialog ─── */
interface PreviewApt {
  id: string;
  number: string;
  floor: number;
  meterId: string;
}

@Component({
  selector: 'app-bulk-apartment-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-white">
      Agregar Deptos Masivo — {{ data.buildingName }} · {{ data.towerName }}
    </h2>
    <mat-dialog-content class="!pt-2 space-y-4 !max-h-[70vh] overflow-y-auto">
      <!-- Config -->
      <div class="grid grid-cols-2 gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Piso desde</mat-label>
          <input matInput type="number" [(ngModel)]="floorFrom" min="1" (ngModelChange)="onConfigChange()" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Piso hasta</mat-label>
          <input matInput type="number" [(ngModel)]="floorTo" min="1" (ngModelChange)="onConfigChange()" />
        </mat-form-field>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Deptos por piso</mat-label>
          <input matInput type="number" [(ngModel)]="aptsPerFloor" min="1" max="50" (ngModelChange)="onConfigChange()" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full col-span-2">
          <mat-label>Número inicial por piso (opcional)</mat-label>
          <input matInput [(ngModel)]="startNumbersText" placeholder="Ej: 101,201,301 o dejar vacío para auto" (ngModelChange)="onStartNumbersChange()" />
          <mat-hint class="!text-xs">Separar por coma. Dejar vacío usa 101, 201, 301…</mat-hint>
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Prefijo medidor</mat-label>
        <input matInput [(ngModel)]="meterPrefix" placeholder="MED-" (ngModelChange)="refreshMeterIds()" />
      </mat-form-field>

      <div>
        <p class="text-xs text-slate-400 mb-2">Tipo de medidor (todos los departamentos nuevos)</p>
        <div class="grid grid-cols-2 gap-2">
          <button type="button"
                  class="flex flex-col items-stretch rounded-xl border-2 p-1.5 transition-colors bg-slate-800/50 hover:bg-slate-700/50 text-left"
                  [class.border-cyan-400]="bulkReadingLayout === 'A'"
                  [class.border-slate-600]="bulkReadingLayout !== 'A'"
                  (click)="bulkReadingLayout = 'A'">
            <img src="assets/meter-types/type_A.png" alt="Tipo A" class="h-20 w-full object-contain rounded-lg bg-slate-900/40" />
            <span class="mt-1 text-xs font-medium text-center text-slate-200">Tipo A</span>
          </button>
          <button type="button"
                  class="flex flex-col items-stretch rounded-xl border-2 p-1.5 transition-colors bg-slate-800/50 hover:bg-slate-700/50 text-left"
                  [class.border-cyan-400]="bulkReadingLayout === 'B'"
                  [class.border-slate-600]="bulkReadingLayout !== 'B'"
                  (click)="bulkReadingLayout = 'B'">
            <img src="assets/meter-types/type_B.png" alt="Tipo B" class="h-20 w-full object-contain rounded-lg bg-slate-900/40" />
            <span class="mt-1 text-xs font-medium text-center text-slate-200">Tipo B</span>
          </button>
        </div>
        <button mat-stroked-button type="button"
                class="!mt-2 !border-slate-600 !text-slate-300"
                (click)="openTypePreview(bulkReadingLayout)">
          <mat-icon>zoom_in</mat-icon>
          Ver imagen en grande
        </button>
        <p class="text-slate-500 text-xs leading-relaxed mt-2">
          Por defecto todos quedan en <span class="text-slate-300">Tipo A</span>.
          Podrás cambiar el tipo de cada departamento individualmente después (icono editar en la lista de deptos).
        </p>
      </div>

      <!-- Stats -->
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs text-slate-400">
          {{ preview().length }} departamentos listos para crear
        </p>
        <button mat-button class="!text-amber-400 !text-xs shrink-0" (click)="resetDefaults()" [disabled]="preview().length === 0">
          <mat-icon style="font-size:14px;width:14px;height:14px;">refresh</mat-icon> Regenerar defaults
        </button>
      </div>

      <!-- Preview grouped by floor -->
      @if (previewByFloor().length > 0) {
        <div class="space-y-3 max-h-80 overflow-y-auto pr-1">
          @for (group of previewByFloor(); track group.floor) {
            <div class="bg-slate-700/40 rounded-xl p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-cyan-400">Piso {{ group.floor }}</span>
                <span class="text-xs text-slate-500">{{ group.items.length }} deptos</span>
              </div>
              <div class="flex flex-wrap gap-2">
                @for (apt of group.items; track apt.id) {
                  <div class="group relative bg-slate-600/60 hover:bg-slate-500/60 rounded-lg px-2 py-1.5 flex items-center gap-2 transition-colors">
                    <input [(ngModel)]="apt.number" (change)="onAptNumberChange(apt)"
                           class="w-10 bg-transparent text-slate-200 text-xs font-mono text-center border-b border-slate-500 focus:border-cyan-400 focus:outline-none" />
                    <span class="text-slate-500 text-xs">|</span>
                    <input [(ngModel)]="apt.meterId" (change)="onMeterIdChange(apt)"
                           class="w-20 bg-transparent text-slate-400 text-[10px] font-mono border-b border-slate-600 focus:border-cyan-400 focus:outline-none" />
                    <button type="button" matTooltip="Eliminar este departamento"
                            class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity"
                            (click)="removeApt(apt.id)">
                      <mat-icon style="font-size:14px;width:14px;height:14px;">close</mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400">Cancelar</button>
      <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold"
              [disabled]="preview().length === 0"
              (click)="confirm()">
        <mat-icon>playlist_add</mat-icon> Crear {{ preview().length }} deptos
      </button>
    </mat-dialog-actions>
  `,
})
export class BulkApartmentDialogComponent {
  readonly data = inject<{ buildingName: string; towerName: string }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BulkApartmentDialogComponent>);
  private readonly dialog = inject(MatDialog);

  // Config
  floorFrom = 1;
  floorTo = 5;
  aptsPerFloor = 2;
  startNumbersText = ''; // comma-separated starting numbers per floor
  meterPrefix = 'MED-';
  bulkReadingLayout: ReadingLayout = 'A';

  /** Vista previa reactiva: el listado por piso se actualiza al cambiar deptos por piso, pisos, etc. */
  readonly preview = signal<PreviewApt[]>([]);
  private idCounter = 1;

  readonly previewByFloor = computed(() => {
    const groups = new Map<number, PreviewApt[]>();
    for (const apt of this.preview()) {
      if (!groups.has(apt.floor)) groups.set(apt.floor, []);
      groups.get(apt.floor)!.push(apt);
    }
    return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([floor, items]) => ({ floor, items }));
  });

  constructor() {
    this.regeneratePreview();
  }

  private regeneratePreview(): void {
    const from = Math.max(1, this.floorFrom || 1);
    const to = Math.max(from, this.floorTo || from);
    const perFloor = Math.max(1, Math.min(50, this.aptsPerFloor || 1));
    const starts = this.parseStartNumbers(from, to, perFloor);

    const apts: PreviewApt[] = [];
    for (let floor = from; floor <= to; floor++) {
      const startNum = starts.get(floor) ?? floor * 100 + 1;
      for (let i = 0; i < perFloor; i++) {
        const num = String(startNum + i);
        apts.push({
          id: `apt-${this.idCounter++}`,
          number: num,
          floor,
          meterId: `${this.meterPrefix}${num}`,
        });
      }
    }
    this.preview.set(apts);
  }

  private parseStartNumbers(fromFloor: number, toFloor: number, perFloor: number): Map<number, number> {
    const starts = new Map<number, number>();
    if (!this.startNumbersText.trim()) {
      // Default: floor * 100 + 1
      for (let f = fromFloor; f <= toFloor; f++) starts.set(f, f * 100 + 1);
      return starts;
    }
    const parts = this.startNumbersText.split(',').map(s => s.trim()).filter(Boolean);
    let floor = fromFloor;
    for (const p of parts) {
      const n = parseInt(p, 10);
      if (!isNaN(n) && floor <= toFloor) {
        starts.set(floor, n);
        floor++;
      }
    }
    // Fill missing with default
    for (let f = fromFloor; f <= toFloor; f++) {
      if (!starts.has(f)) starts.set(f, f * 100 + 1);
    }
    return starts;
  }

  onConfigChange(): void {
    queueMicrotask(() => this.regeneratePreview());
  }

  onStartNumbersChange(): void {
    const from = Math.max(1, this.floorFrom || 1);
    const to = Math.max(from, this.floorTo || from);
    const perFloor = Math.max(1, Math.min(50, this.aptsPerFloor || 1));
    const expected = (to - from + 1) * perFloor;
    const current = this.preview();
    if (current.length !== expected) {
      this.regeneratePreview();
      return;
    }
    const starts = this.parseStartNumbers(from, to, perFloor);
    const list = current.map(a => ({ ...a }));
    let idx = 0;
    for (let floor = from; floor <= to; floor++) {
      const startNum = starts.get(floor) ?? floor * 100 + 1;
      for (let i = 0; i < perFloor; i++) {
        if (idx < list.length) {
          const num = String(startNum + i);
          list[idx].number = num;
          list[idx].meterId = `${this.meterPrefix}${num}`;
          idx++;
        }
      }
    }
    this.preview.set(list);
  }

  refreshMeterIds(): void {
    this.preview.update(prev =>
      prev.map(apt => ({
        ...apt,
        meterId: `${this.meterPrefix}${apt.number}`,
      })),
    );
  }

  onAptNumberChange(apt: PreviewApt): void {
    apt.meterId = `${this.meterPrefix}${apt.number}`;
    this.preview.update(prev => [...prev]);
  }

  onMeterIdChange(_apt: PreviewApt): void {
    this.preview.update(prev => [...prev]);
  }

  removeApt(id: string): void {
    this.preview.update(prev => prev.filter(a => a.id !== id));
  }

  resetDefaults(): void {
    this.regeneratePreview();
  }

  openTypePreview(type: ReadingLayout): void {
    this.dialog.open(MeterTypePreviewDialogComponent, {
      width: 'min(95vw, 720px)',
      panelClass: 'dark-dialog',
      data: { type },
    });
  }

  confirm(): void {
    this.dialogRef.close(
      this.preview().map(a => ({
        number: a.number,
        floor: a.floor,
        meterId: a.meterId,
        readingLayout: this.bulkReadingLayout,
      })),
    );
  }
}

/* ─── Edit apartment dialog ─── */
@Component({
  selector: 'app-edit-apartment-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-white">Editar Depto — {{ data.buildingName }} · {{ data.towerName }}</h2>
    <mat-dialog-content class="!pt-2 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Número de Depto</mat-label>
          <input matInput [(ngModel)]="form.number" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Piso</mat-label>
          <input matInput [(ngModel)]="form.floor" type="number" />
        </mat-form-field>
      </div>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>ID Medidor</mat-label>
        <input matInput [(ngModel)]="form.meterId" />
      </mat-form-field>
      <div>
        <p class="text-xs text-slate-400 mb-2">Tipo de medidor</p>
        <div class="grid grid-cols-2 gap-3">
          <button type="button"
                  class="flex flex-col items-stretch rounded-xl border-2 p-2 transition-colors bg-slate-800/50 hover:bg-slate-700/50 text-left"
                  [class.border-cyan-400]="form.readingLayout === 'A'"
                  [class.border-slate-600]="form.readingLayout !== 'A'"
                  (click)="form.readingLayout = 'A'">
            <img src="assets/meter-types/type_A.png" alt="Referencia medidor tipo A"
                 class="h-24 w-full object-contain rounded-lg bg-slate-900/40" />
            <span class="mt-2 text-sm font-medium text-center text-slate-200">Tipo A</span>
          </button>
          <button type="button"
                  class="flex flex-col items-stretch rounded-xl border-2 p-2 transition-colors bg-slate-800/50 hover:bg-slate-700/50 text-left"
                  [class.border-cyan-400]="form.readingLayout === 'B'"
                  [class.border-slate-600]="form.readingLayout !== 'B'"
                  (click)="form.readingLayout = 'B'">
            <img src="assets/meter-types/type_B.png" alt="Referencia medidor tipo B"
                 class="h-24 w-full object-contain rounded-lg bg-slate-900/40" />
            <span class="mt-2 text-sm font-medium text-center text-slate-200">Tipo B</span>
          </button>
        </div>
        <button mat-stroked-button type="button"
                class="!mt-2 !border-slate-600 !text-slate-300"
                (click)="openTypePreview(form.readingLayout)">
          <mat-icon>zoom_in</mat-icon>
          Ver imagen en grande
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400">Cancelar</button>
      <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold"
              [disabled]="!form.number || !form.meterId"
              [mat-dialog-close]="form">Guardar</button>
    </mat-dialog-actions>
  `,
})
export class EditApartmentDialogComponent {
  readonly data = inject<{
    apartment: Apartment;
    towerName: string;
    buildingName: string;
  }>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);

  form = {
    number: '',
    floor: 1,
    meterId: '',
    readingLayout: 'A' as ReadingLayout,
  };

  constructor() {
    const a = this.data.apartment;
    this.form.number = a.number;
    this.form.floor = a.floor;
    this.form.meterId = a.meterId;
    this.form.readingLayout = a.readingLayout;
  }

  openTypePreview(type: ReadingLayout): void {
    this.dialog.open(MeterTypePreviewDialogComponent, {
      width: 'min(95vw, 720px)',
      panelClass: 'dark-dialog',
      data: { type },
    });
  }
}

/* ─── Meter type image preview dialog ─── */
@Component({
  selector: 'app-meter-type-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="!text-white">
      Referencia visual — {{ data.type === 'B' ? 'Tipo B' : 'Tipo A' }}
    </h2>
    <mat-dialog-content class="!pt-2">
      <img
        [src]="data.type === 'B' ? 'assets/meter-types/type_B.png' : 'assets/meter-types/type_A.png'"
        [alt]="data.type === 'B' ? 'Medidor tipo B' : 'Medidor tipo A'"
        class="w-full max-h-[70vh] object-contain rounded-xl bg-slate-900/40 p-2"
      />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close class="!border-slate-600 !text-slate-300">Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class MeterTypePreviewDialogComponent {
  readonly data = inject<{ type: ReadingLayout }>(MAT_DIALOG_DATA);
}
