import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { BuildingService } from '../../core/services/building.service';
import { UserService } from '../../core/services/user.service';
import { QrService } from '../../core/services/qr.service';
import { Building, Tower, Apartment } from '../../core/models/building.model';

@Component({
  selector: 'app-buildings',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule, MatExpansionModule],
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
              <button mat-icon-button class="!text-cyan-400" (click)="openAddTower(building)">
                <mat-icon style="font-size:20px;width:20px;height:20px;">add</mat-icon>
              </button>
              <button mat-icon-button class="!text-slate-400 hover:!text-red-400" (click)="deleteBuilding(building)">
                <mat-icon style="font-size:18px;width:18px;height:18px;">delete_outline</mat-icon>
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
                  <button mat-icon-button class="!text-cyan-400 !w-8 !h-8" (click)="openAddApartment(building, tower)">
                    <mat-icon style="font-size:18px;width:18px;height:18px;">add</mat-icon>
                  </button>
                  <button mat-icon-button class="!text-slate-400 hover:!text-red-400 !w-8 !h-8"
                          (click)="deleteTower(building, tower)">
                    <mat-icon style="font-size:16px;width:16px;height:16px;">delete_outline</mat-icon>
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
                      <span class="text-xs px-1 rounded" [class]="getOperatorForApt(apt.id) ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'">
                        {{ getOperatorForApt(apt.id) || 'Sin asignar' }}
                      </span>
                      <button class="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
    ref.afterClosed().subscribe(async result => {
      if (result) {
        this.buildingService.addApartment(building.id, tower.id, {
          number: result.number,
          meterId: result.meterId,
          floor: result.floor,
        });
        await this.qrService.addQr(tower.name, result.number, result.meterId);
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

  form: any = {
    name: '',
    address: '',
    number: '',
    floor: 1,
    meterId: '',
  };

  isValid(): boolean {
    switch (this.data.type) {
      case 'building': return !!(this.form.name && this.form.address);
      case 'tower': return !!this.form.name;
      case 'apartment': return !!(this.form.number && this.form.meterId);
    }
  }
}
