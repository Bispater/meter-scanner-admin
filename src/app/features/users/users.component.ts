import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../core/services/user.service';
import { BuildingService } from '../../core/services/building.service';
import { MeasurementService } from '../../core/services/measurement.service';
import { ImageLightboxDialogComponent } from '../measurements/image-lightbox-dialog.component';
import { DistributeWorkDialogComponent } from '../buildings/buildings.component';
import { AppUser, UserRole } from '../../core/models/user.model';
import { Measurement } from '../../core/models/measurement.model';
import { environment } from '../../../environments/environment';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule, MatChipsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Gestión de Usuarios</h2>
          <p class="text-slate-400 text-sm mt-1">Administrar operadores y sus asignaciones</p>
        </div>
        <div class="flex items-center gap-2">
          <button mat-stroked-button class="!border-emerald-500/40 !text-emerald-400 !font-medium cursor-pointer" (click)="openDistributeWork()">
            <mat-icon class="!mr-1" style="font-size:18px;width:18px;height:18px;vertical-align:middle;">groups</mat-icon>
            Repartir trabajo
          </button>
          <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold cursor-pointer" (click)="openCreateDialog()">
            <mat-icon>person_add</mat-icon> Nuevo Usuario
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <mat-icon class="text-cyan-400" style="font-size:20px;width:20px;height:20px;">people</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ userService.users().length }}</p>
              <p class="text-xs text-slate-400">Total Usuarios</p>
            </div>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <mat-icon class="text-green-400" style="font-size:20px;width:20px;height:20px;">check_circle</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ userService.activeOperators().length }}</p>
              <p class="text-xs text-slate-400">Operadores Activos</p>
            </div>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <mat-icon class="text-amber-400" style="font-size:20px;width:20px;height:20px;">admin_panel_settings</mat-icon>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">{{ countAdmins() }}</p>
              <p class="text-xs text-slate-400">Administradores</p>
            </div>
          </div>
        </div>
      </div>

      <!-- User list -->
      <div class="space-y-3">
        @for (user of userService.users(); track user.id) {
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-cyan-500/30 transition-colors">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                     [class]="user.active ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-700 text-slate-500'">
                  {{ user.displayName.charAt(0) }}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm font-bold text-white">{{ user.displayName }}</p>
                    <span class="text-xs px-2 py-0.5 rounded-full"
                          [class]="user.role === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-cyan-500/15 text-cyan-400'">
                      {{ user.role === 'admin' ? 'Admin' : 'Operador' }}
                    </span>
                    @if (!user.active) {
                      <span class="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Inactivo</span>
                    }
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">{{ user.email }} · {{ user.phone }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">Usuario: {{ user.username }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                @if (user.role === 'operator') {
                  <button mat-stroked-button class="!border-slate-600 !text-slate-400 text-xs cursor-pointer"
                          (click)="openAssignDialog(user)">
                    <mat-icon class="!mr-1" style="font-size:16px;width:16px;height:16px;vertical-align:middle;">assignment</mat-icon>
                    {{ user.assignedApartmentIds.length }} asignados
                  </button>
                  <button mat-stroked-button class="!border-cyan-500/40 !text-cyan-400 text-xs cursor-pointer"
                          (click)="openConsumptionDialog(user)">
                    <mat-icon class="!mr-1" style="font-size:16px;width:16px;height:16px;vertical-align:middle;">assessment</mat-icon>
                    Ver actividad
                  </button>
                }
                <button mat-icon-button class="!text-slate-400 hover:!text-cyan-400 cursor-pointer"
                        (click)="openEditDialog(user)"
                        style="display:inline-flex;align-items:center;justify-content:center;">
                  <mat-icon style="font-size:20px;width:20px;height:20px;">edit</mat-icon>
                </button>
                <button mat-icon-button class="!text-slate-400 hover:!text-amber-400 cursor-pointer"
                        (click)="toggleActive(user)"
                        style="display:inline-flex;align-items:center;justify-content:center;">
                  <mat-icon style="font-size:22px;width:22px;height:22px;">
                    {{ user.active ? 'toggle_on' : 'toggle_off' }}
                  </mat-icon>
                </button>
                <button mat-icon-button class="!text-slate-400 hover:!text-red-400 cursor-pointer"
                        (click)="requestDeleteUser(user)"
                        matTooltip="Eliminar usuario"
                        style="display:inline-flex;align-items:center;justify-content:center;">
                  <mat-icon style="font-size:20px;width:20px;height:20px;">delete_outline</mat-icon>
                </button>
              </div>
            </div>

            <!-- Assigned apartments preview (collapsible) -->
            @if (user.role === 'operator' && user.assignedApartmentIds.length > 0) {
              <div class="mt-3 pt-3 border-t border-slate-700">
                <button type="button" class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer mb-2"
                        (click)="toggleExpanded(user.id)">
                  <mat-icon style="font-size:16px;width:16px;height:16px;transition:transform 0.2s;"
                            [style.transform]="isExpanded(user.id) ? 'rotate(90deg)' : 'rotate(0)'">
                    chevron_right
                  </mat-icon>
                  {{ user.assignedApartmentIds.length }} departamentos asignados
                </button>
                @if (isExpanded(user.id)) {
                  <div class="flex flex-wrap gap-1.5 max-h-60 overflow-y-auto">
                    @for (apt of getAssignedApartments(user); track apt.id) {
                      <span class="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {{ apt.buildingName }} · {{ apt.towerName }} · {{ apt.number }}
                      </span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class UsersComponent {
  readonly userService = inject(UserService);
  private readonly buildingService = inject(BuildingService);
  private readonly measurementService = inject(MeasurementService);
  private readonly dialog = inject(MatDialog);
  private readonly http = inject(HttpClient);

  private expandedUserIds = new Set<string>();

  countAdmins(): number {
    return this.userService.users().filter(u => u.role === 'admin').length;
  }

  isExpanded(userId: string): boolean {
    return this.expandedUserIds.has(userId);
  }

  toggleExpanded(userId: string): void {
    if (this.expandedUserIds.has(userId)) {
      this.expandedUserIds.delete(userId);
    } else {
      this.expandedUserIds.add(userId);
    }
  }

  getAssignedApartments(user: AppUser) {
    const all = this.buildingService.allApartments();
    return all.filter(a => user.assignedApartmentIds.includes(a.id));
  }

  requestDeleteUser(user: AppUser): void {
    const assignedCount = user.assignedApartmentIds.length;
    const ref = this.dialog.open(DeleteUserDialogComponent, {
      width: '440px',
      panelClass: 'dark-dialog',
      data: { user, assignedCount },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.userService.deleteUser(user.id);
    });
  }

  toggleActive(user: AppUser): void {
    const action = user.active ? 'desactivar' : 'activar';
    const ref = this.dialog.open(ConfirmToggleDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: { userName: user.displayName, action },
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) this.userService.toggleActive(user.id);
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      panelClass: 'dark-dialog',
      data: { mode: 'create' },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.userService.addUser(result);
      }
    });
  }

  openEditDialog(user: AppUser): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '500px',
      panelClass: 'dark-dialog',
      data: { mode: 'edit', user },
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateUser(user.id, result);
      }
    });
  }

  openConsumptionDialog(user: AppUser): void {
    const measurements = this.measurementService.getMeasurementsByOperator(user.id);
    this.dialog.open(UserConsumptionDialogComponent, {
      width: '95vw',
      maxWidth: '1100px',
      maxHeight: '90vh',
      panelClass: 'dark-dialog',
      data: { user, measurements },
    });
  }

  openDistributeWork(): void {
    const buildings = this.buildingService.buildings();
    if (buildings.length === 0) return;

    if (buildings.length === 1) {
      this._openDistributeDialog(buildings[0]);
      return;
    }

    const ref = this.dialog.open(BuildingPickerDialogComponent, {
      width: '400px',
      panelClass: 'dark-dialog',
      data: { buildings },
    });
    ref.afterClosed().subscribe((building: any) => {
      if (building) this._openDistributeDialog(building);
    });
  }

  private _openDistributeDialog(building: any): void {
    const ref = this.dialog.open(DistributeWorkDialogComponent, {
      width: '600px',
      panelClass: 'dark-dialog',
      data: { building },
    });
    ref.afterClosed().subscribe((result: { operatorId: string; apartmentIds: string[] }[] | undefined) => {
      if (!result?.length) return;
      for (const assignment of result) {
        this.userService.assignApartments(assignment.operatorId, assignment.apartmentIds);
      }
    });
  }

  openAssignDialog(user: AppUser): void {
    const takenByOthers = this._buildTakenMap(user.id);
    const http = this.http;
    const url = `${environment.apiUrl}/accounts/users/${user.id}/protected-apartments/`;
    http.get<{ protected_apartment_ids: number[] }>(url).subscribe({
      next: res => {
        const protectedIds = (res.protected_apartment_ids || []).map(String);
        const ref = this.dialog.open(AssignApartmentsDialogComponent, {
          width: '640px',
          panelClass: 'dark-dialog',
          data: { user, protectedIds, takenByOthers },
        });
        ref.afterClosed().subscribe(result => {
          if (result !== undefined) {
            this.userService.assignApartments(user.id, result);
          }
        });
      },
      error: () => {
        const ref = this.dialog.open(AssignApartmentsDialogComponent, {
          width: '640px',
          panelClass: 'dark-dialog',
          data: { user, protectedIds: [], takenByOthers },
        });
        ref.afterClosed().subscribe(result => {
          if (result !== undefined) this.userService.assignApartments(user.id, result);
        });
      },
    });
  }

  private _buildTakenMap(currentUserId: string): Map<string, string> {
    const taken = new Map<string, string>();
    for (const u of this.userService.users()) {
      if (u.id === currentUserId) continue;
      for (const aptId of u.assignedApartmentIds) {
        taken.set(aptId, u.displayName.split(' ')[0]);
      }
    }
    return taken;
  }
}

/* ─── User Form Dialog (Create / Edit) ─── */
@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-white">
      {{ data.mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario' }}
    </h2>
    <mat-dialog-content class="!pt-2 space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nombre Completo</mat-label>
          <input matInput [(ngModel)]="form.displayName" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Usuario</mat-label>
          <input matInput [(ngModel)]="form.username" />
        </mat-form-field>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="form.email" type="email" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Teléfono</mat-label>
          <input matInput [(ngModel)]="form.phone" />
        </mat-form-field>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Contraseña</mat-label>
          <input matInput [(ngModel)]="form.password" type="password" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Rol</mat-label>
          <mat-select [(ngModel)]="form.role">
            <mat-option value="admin">Administrador</mat-option>
            <mat-option value="operator">Operador</mat-option>
          </mat-select>
        </mat-form-field>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400">Cancelar</button>
      <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold"
              [disabled]="!isValid()"
              [mat-dialog-close]="buildResult()">
        <mat-icon>{{ data.mode === 'create' ? 'person_add' : 'save' }}</mat-icon>
        {{ data.mode === 'create' ? 'Crear' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class UserFormDialogComponent {
  readonly data = inject<{ mode: 'create' | 'edit'; user?: AppUser }>(MAT_DIALOG_DATA);

  form = {
    displayName: this.data.user?.displayName ?? '',
    username: this.data.user?.username ?? '',
    email: this.data.user?.email ?? '',
    phone: this.data.user?.phone ?? '',
    password: this.data.user?.password ?? '',
    role: (this.data.user?.role ?? 'operator') as UserRole,
  };

  isValid(): boolean {
    if (this.data.mode === 'create') {
      return !!(this.form.displayName && this.form.username && this.form.password && this.form.role);
    }
    return !!(this.form.displayName && this.form.username && this.form.role);
  }

  buildResult() {
    return {
      ...this.form,
      active: this.data.user?.active ?? true,
      assignedApartmentIds: this.data.user?.assignedApartmentIds ?? [],
    };
  }
}

/* ─── Assign Apartments Dialog ─── */
@Component({
  selector: 'app-assign-apartments-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatSelectModule, MatFormFieldModule, MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-white">
      Asignar Departamentos — {{ data.user.displayName }}
    </h2>
    <mat-dialog-content class="!pt-2">
      <div class="flex gap-2 mb-4">
        <button mat-stroked-button class="!border-cyan-500 !text-cyan-400 text-xs" (click)="selectAll()">
          <mat-icon style="font-size:14px;width:14px;height:14px;">select_all</mat-icon> Todos
        </button>
        <button mat-stroked-button class="!border-slate-600 !text-slate-400 text-xs" (click)="clearAll()">
          <mat-icon style="font-size:14px;width:14px;height:14px;">deselect</mat-icon> Limpiar
        </button>
      </div>

      @if (protectedIds.length > 0 || takenByOthers.size > 0) {
        <div class="mb-3 space-y-2">
          @if (protectedIds.length > 0) {
            <div class="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
              <mat-icon class="text-amber-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">lock</mat-icon>
              <p class="text-xs text-amber-300">
                Los departamentos con <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle" class="text-amber-400">lock</mat-icon>
                tienen mediciones verificadas y no pueden ser removidos.
              </p>
            </div>
          }
          @if (takenByOthers.size > 0) {
            <div class="px-3 py-2 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2">
              <mat-icon class="text-rose-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">person</mat-icon>
              <p class="text-xs text-rose-300">
                Los departamentos con <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle" class="text-rose-400">person</mat-icon>
                ya están asignados a otro operador y no se pueden seleccionar.
              </p>
            </div>
          }
        </div>
      }

      <div class="max-h-[420px] overflow-y-auto space-y-4 pr-1">
        @for (building of buildings(); track building.id) {
          <div class="border border-slate-700 rounded-lg p-3">
            <p class="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
              <mat-icon style="font-size:16px;width:16px;height:16px;" class="text-cyan-400">domain</mat-icon>
              {{ building.name }}
            </p>
            @for (tower of building.towers; track tower.id) {
              <div class="ml-4 mb-3">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="text-xs text-slate-300 font-semibold">{{ tower.name }}</span>
                  <button class="text-[10px] px-1.5 py-0.5 rounded border border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                          (click)="selectTower(tower)">
                    Torre completa
                  </button>
                  <button class="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 hover:border-slate-500 transition-colors"
                          (click)="deselectTower(tower)">
                    Quitar
                  </button>
                </div>
                <div class="flex flex-wrap gap-1.5 ml-2">
                  @for (apt of tower.apartments; track apt.id) {
                    <button class="text-xs px-2 py-1 rounded border transition-colors relative"
                            [class]="btnClass(apt.id)"
                            [disabled]="isProtected(apt.id) || isTaken(apt.id)"
                            [matTooltip]="isProtected(apt.id) ? 'Tiene medición verificada — no se puede remover' : isTaken(apt.id) ? 'Asignado a ' + takenBy(apt.id) : ''"
                            (click)="onAptClick($event, apt.id)">
                      {{ apt.number }}
                      @if (isProtected(apt.id)) {
                        <mat-icon class="text-amber-400 !w-3 !h-3 absolute -top-1 -right-1" style="font-size:10px">lock</mat-icon>
                      }
                      @if (isTaken(apt.id)) {
                        <mat-icon class="text-rose-400 !w-3 !h-3 absolute -top-1 -right-1" style="font-size:10px">person</mat-icon>
                      }
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="mt-3 px-3 py-2 bg-slate-700/40 rounded-lg flex items-center justify-between">
        <p class="text-xs text-slate-500">
          {{ selectedIds.length }} departamentos seleccionados
          @if (protectedIds.length > 0) {
            · <span class="text-amber-400">{{ protectedIds.length }} protegidos</span>
          }
        </p>
        <p class="text-[10px] text-slate-600 flex items-center gap-1">
          <mat-icon style="font-size:12px;width:12px;height:12px;" class="text-slate-500">keyboard</mat-icon>
          <span class="text-slate-500">Shift + clic</span> para seleccionar rango
        </p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400">Cancelar</button>
      <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold"
              [mat-dialog-close]="selectedIds">
        <mat-icon>save</mat-icon> Guardar Asignación
      </button>
    </mat-dialog-actions>
  `,
})
export class AssignApartmentsDialogComponent {
  readonly data = inject<{ user: AppUser; protectedIds?: string[]; takenByOthers?: Map<string, string> }>(MAT_DIALOG_DATA);
  private readonly buildingService = inject(BuildingService);

  readonly buildings = this.buildingService.buildings;
  selectedIds: string[] = [...this.data.user.assignedApartmentIds];
  protectedIds: string[] = this.data.protectedIds ?? [];
  takenByOthers: Map<string, string> = this.data.takenByOthers ?? new Map();

  private lastClickedAptId: string | null = null;
  private flatAptIds: string[] = [];

  constructor() {
    this.flatAptIds = this.buildingService.buildings().flatMap(b =>
      b.towers.flatMap(t => t.apartments.map(a => a.id))
    );
  }

  isSelected(id: string): boolean { return this.selectedIds.includes(id); }
  isProtected(id: string): boolean { return this.protectedIds.includes(id); }
  isTaken(id: string): boolean { return this.takenByOthers.has(id) && !this.isSelected(id); }
  takenBy(id: string): string { return this.takenByOthers.get(id) ?? ''; }

  btnClass(id: string): string {
    if (this.isProtected(id)) return 'bg-amber-500/15 border-amber-500/50 text-amber-300 cursor-not-allowed';
    if (this.isSelected(id)) return 'bg-cyan-500/20 border-cyan-500 text-cyan-300 cursor-pointer';
    if (this.isTaken(id)) return 'bg-rose-500/10 border-rose-500/30 text-rose-300/60 cursor-not-allowed';
    return 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 cursor-pointer';
  }

  onAptClick(event: MouseEvent, id: string): void {
    if (this.isProtected(id)) return;
    if (this.isTaken(id)) return;

    if (event.shiftKey && this.lastClickedAptId) {
      const startIdx = this.flatAptIds.indexOf(this.lastClickedAptId);
      const endIdx = this.flatAptIds.indexOf(id);
      if (startIdx !== -1 && endIdx !== -1) {
        const from = Math.min(startIdx, endIdx);
        const to = Math.max(startIdx, endIdx);
        const rangeIds = this.flatAptIds.slice(from, to + 1);
        const shouldSelect = !this.isSelected(id);
        if (shouldSelect) {
          const toAdd = rangeIds.filter(rid => !this.isSelected(rid) && !this.isProtected(rid) && !this.isTaken(rid));
          this.selectedIds = [...this.selectedIds, ...toAdd];
        } else {
          const removeSet = new Set(rangeIds.filter(rid => !this.isProtected(rid)));
          this.selectedIds = this.selectedIds.filter(sid => !removeSet.has(sid));
        }
        this.lastClickedAptId = id;
        return;
      }
    }

    this.toggle(id);
    this.lastClickedAptId = id;
  }

  toggle(id: string): void {
    if (this.isProtected(id)) return;
    if (this.isSelected(id)) {
      this.selectedIds = this.selectedIds.filter(i => i !== id);
    } else {
      this.selectedIds = [...this.selectedIds, id];
    }
  }

  selectTower(tower: { apartments: { id: string }[] }): void {
    const ids = tower.apartments.map(a => a.id);
    const toAdd = ids.filter(id => !this.isSelected(id) && !this.isTaken(id));
    this.selectedIds = [...this.selectedIds, ...toAdd];
  }

  deselectTower(tower: { apartments: { id: string }[] }): void {
    const ids = tower.apartments.map(a => a.id);
    this.selectedIds = this.selectedIds.filter(id => !ids.includes(id) || this.isProtected(id));
  }

  selectAll(): void {
    this.selectedIds = this.buildingService.allApartments()
      .map(a => a.id)
      .filter(id => !this.isTaken(id));
  }

  clearAll(): void {
    this.selectedIds = [...this.protectedIds];
  }
}

/* ─── User Activity Dialog (two-column layout) ─── */
@Component({
  selector: 'app-user-consumption-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title class="!text-white flex items-center gap-2">
      <mat-icon class="text-cyan-400">assessment</mat-icon>
      Actividad de {{ data.user.displayName }}
    </h2>
    <mat-dialog-content class="!pt-2 !overflow-hidden">
      <div class="flex gap-5" style="min-height:480px;">

        <!-- LEFT COLUMN: Stats + Chart -->
        <div class="w-[420px] shrink-0 flex flex-col">
          <!-- Stats -->
          <div class="grid grid-cols-4 gap-2 mb-4">
            <div class="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <p class="text-lg font-bold text-white">{{ data.measurements.length }}</p>
              <p class="text-[10px] text-slate-400">Total</p>
            </div>
            <div class="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <p class="text-lg font-bold text-emerald-400">{{ verifiedCount }}</p>
              <p class="text-[10px] text-slate-400">Verificadas</p>
            </div>
            <div class="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <p class="text-lg font-bold text-amber-400">{{ pendingCount }}</p>
              <p class="text-[10px] text-slate-400">Pendientes</p>
            </div>
            <div class="bg-slate-700/50 rounded-lg p-2.5 text-center">
              <p class="text-lg font-bold text-red-400">{{ rejectedCount }}</p>
              <p class="text-[10px] text-slate-400">Rechazadas</p>
            </div>
          </div>

          <!-- Chart -->
          @if (data.measurements.length > 0) {
            <div class="flex-1 relative" style="min-height:320px;">
              <canvas #statusChart></canvas>
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center text-slate-500">
              <mat-icon style="font-size:40px;width:40px;height:40px;" class="mb-2 opacity-40">bar_chart</mat-icon>
              <p class="text-sm">Sin mediciones registradas.</p>
            </div>
          }
        </div>

        <!-- RIGHT COLUMN: Measurements list with filters -->
        <div class="flex-1 flex flex-col min-w-0 border-l border-slate-700 pl-5">
          <div class="flex items-center justify-between mb-3">
            <p class="text-sm font-semibold text-white">Mediciones</p>
            <span class="text-xs text-slate-500">{{ filteredMeasurements().length }} resultado{{ filteredMeasurements().length !== 1 ? 's' : '' }}</span>
          </div>

          <!-- Filters -->
          <div class="flex gap-2 mb-3">
            <div class="flex gap-1">
              @for (f of statusFilters; track f.value) {
                <button type="button"
                        class="text-[11px] px-2 py-1 rounded-md border transition-colors cursor-pointer"
                        [class]="filterStatus === f.value ? f.activeClass : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'"
                        (click)="filterStatus = f.value; applyFilters()">
                  {{ f.label }}
                </button>
              }
            </div>
            <input type="text" placeholder="Buscar torre, depto, medidor..."
                   class="flex-1 text-xs bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-slate-300 placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                   [(ngModel)]="filterText" (input)="applyFilters()" />
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto space-y-1.5 pr-1" style="max-height:400px;">
            @for (m of filteredMeasurements(); track m.id) {
              <div class="flex items-center gap-3 bg-slate-700/40 rounded-lg px-3 py-2 hover:bg-slate-700/60 transition-colors">
                <div class="w-2 h-2 rounded-full shrink-0"
                     [class]="m.status === 'verified' ? 'bg-emerald-400' : m.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'">
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-white font-medium truncate">{{ m.tower }} — Depto {{ m.apartment }}</span>
                    <span class="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                          [class]="m.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400' : m.status === 'rejected' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'">
                      {{ m.status === 'verified' ? 'Verificada' : m.status === 'rejected' ? 'Rechazada' : 'Pendiente' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 mt-0.5">
                    <span class="text-xs text-slate-500">{{ formatDate(m.captured_at) }}</span>
                    <span class="text-xs text-slate-400 font-mono">{{ m.reading_value }} {{ m.unit }}</span>
                    <span class="text-xs text-slate-600 truncate">{{ m.meter_id }}</span>
                  </div>
                </div>
                @if (m.photo_url) {
                  <button type="button"
                          class="text-slate-500 hover:text-cyan-400 transition-colors shrink-0 cursor-pointer"
                          matTooltip="Ver foto"
                          (click)="openPhoto(m.photo_url, m.tower, m.apartment)">
                    <mat-icon style="font-size:16px;width:16px;height:16px;">photo_camera</mat-icon>
                  </button>
                }
              </div>
            }

            @if (filteredMeasurements().length === 0 && data.measurements.length > 0) {
              <div class="flex flex-col items-center justify-center py-8 text-slate-500">
                <mat-icon style="font-size:32px;width:32px;height:32px;" class="mb-2 opacity-40">search_off</mat-icon>
                <p class="text-xs">No hay mediciones con estos filtros.</p>
              </div>
            }

            @if (data.measurements.length === 0) {
              <div class="flex flex-col items-center justify-center py-8 text-slate-500">
                <mat-icon style="font-size:32px;width:32px;height:32px;" class="mb-2 opacity-40">inbox</mat-icon>
                <p class="text-xs">Este operador no tiene mediciones.</p>
              </div>
            }
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class UserConsumptionDialogComponent implements AfterViewInit, OnDestroy {
  readonly data = inject<{ user: AppUser; measurements: Measurement[] }>(MAT_DIALOG_DATA);
  private readonly dialog = inject(MatDialog);

  @ViewChild('statusChart') chartRef!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  readonly verifiedCount = this.data.measurements.filter(m => m.status === 'verified').length;
  readonly pendingCount = this.data.measurements.filter(m => m.status === 'pending_review').length;
  readonly rejectedCount = this.data.measurements.filter(m => m.status === 'rejected').length;

  filterStatus: '' | 'verified' | 'pending_review' | 'rejected' = '';
  filterText = '';
  readonly filteredMeasurements = signal<Measurement[]>([...this.data.measurements]);

  readonly statusFilters = [
    { value: '' as const, label: 'Todas', activeClass: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' },
    { value: 'verified' as const, label: 'Verificadas', activeClass: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' },
    { value: 'pending_review' as const, label: 'Pendientes', activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
    { value: 'rejected' as const, label: 'Rechazadas', activeClass: 'bg-red-500/20 border-red-500/50 text-red-400' },
  ];

  applyFilters(): void {
    let result = this.data.measurements;
    if (this.filterStatus) {
      result = result.filter(m => m.status === this.filterStatus);
    }
    const term = this.filterText.toLowerCase().trim();
    if (term) {
      result = result.filter(m =>
        m.tower.toLowerCase().includes(term) ||
        m.apartment.toLowerCase().includes(term) ||
        m.meter_id.toLowerCase().includes(term)
      );
    }
    this.filteredMeasurements.set(result);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  openPhoto(url: string, tower: string, apartment: string): void {
    this.dialog.open(ImageLightboxDialogComponent, {
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'lightbox-dialog',
      data: { photoUrl: url, alt: `${tower} — Depto ${apartment}` },
    });
  }

  ngAfterViewInit(): void {
    if (this.data.measurements.length === 0) return;
    setTimeout(() => this._buildChart(), 50);
  }

  private _buildChart(): void {
    if (!this.chartRef?.nativeElement) return;

    const measurements = this.data.measurements;
    const mNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    const months = 12;
    const labels: string[] = [];
    const verified: number[] = [];
    const pending: number[] = [];
    const rejected: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${mNames[d.getMonth()]} ${d.getFullYear()}`);
      const monthMs = measurements.filter(m => {
        const md = new Date(m.captured_at);
        return md.getFullYear() === d.getFullYear() && md.getMonth() === d.getMonth();
      });
      verified.push(monthMs.filter(m => m.status === 'verified').length);
      pending.push(monthMs.filter(m => m.status === 'pending_review').length);
      rejected.push(monthMs.filter(m => m.status === 'rejected').length);
    }

    const gridColor = 'rgba(148,163,184,0.1)';
    const labelColor = '#94a3b8';

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Verificadas',
            data: verified,
            backgroundColor: 'rgba(52,211,153,0.35)',
            borderColor: '#34d399',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Pendientes',
            data: pending,
            backgroundColor: 'rgba(251,191,36,0.35)',
            borderColor: '#fbbf24',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Rechazadas',
            data: rejected,
            backgroundColor: 'rgba(248,113,113,0.35)',
            borderColor: '#f87171',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: labelColor, font: { size: 11 }, boxWidth: 12, padding: 12 },
          },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y}` },
          },
        },
        scales: {
          x: {
            stacked: true,
            ticks: { color: labelColor, font: { size: 9 }, maxRotation: 45 },
            grid: { color: gridColor },
            border: { color: gridColor },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: labelColor, font: { size: 11 }, stepSize: 1 },
            grid: { color: gridColor },
            border: { color: gridColor },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}

/* ─── Building Picker Dialog (for distribute work) ─── */
@Component({
  selector: 'app-building-picker-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="!text-white flex items-center gap-2">
      <mat-icon class="text-emerald-400">domain</mat-icon>
      Seleccionar edificio
    </h2>
    <mat-dialog-content class="!pt-2">
      <p class="text-xs text-slate-400 mb-3">Selecciona el edificio cuyos departamentos quieres repartir.</p>
      <div class="space-y-2">
        @for (b of data.buildings; track b.id) {
          <button type="button"
                  class="w-full flex items-center gap-3 bg-slate-700/40 rounded-lg px-4 py-3 hover:bg-slate-700/70 transition-colors cursor-pointer text-left"
                  [mat-dialog-close]="b">
            <mat-icon class="text-cyan-400" style="font-size:20px;width:20px;height:20px;">domain</mat-icon>
            <div class="flex-1">
              <span class="text-sm font-semibold text-white">{{ b.name }}</span>
              <p class="text-xs text-slate-500">{{ b.address }}</p>
            </div>
            <span class="text-xs text-slate-500">{{ countApts(b) }} dptos</span>
          </button>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cancelar</button>
    </mat-dialog-actions>
  `,
})
export class BuildingPickerDialogComponent {
  readonly data = inject<{ buildings: any[] }>(MAT_DIALOG_DATA);

  countApts(building: any): number {
    return building.towers.reduce((sum: number, t: any) => sum + t.apartments.length, 0);
  }
}

/* ─── Confirm Toggle Dialog ─── */
@Component({
  selector: 'app-confirm-toggle-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="!text-white flex items-center gap-2">
      <mat-icon class="text-amber-400">warning</mat-icon>
      Confirmar acción
    </h2>
    <mat-dialog-content>
      <p class="text-sm text-slate-300">
        ¿Estás seguro de que deseas <strong class="text-white">{{ data.action }}</strong> al usuario <strong class="text-white">{{ data.userName }}</strong>?
      </p>
      @if (data.action === 'desactivar') {
        <p class="text-xs text-amber-400 mt-2 flex items-center gap-1">
          <mat-icon style="font-size:14px;width:14px;height:14px;">info</mat-icon>
          El usuario no podrá iniciar sesión mientras esté desactivado.
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cancelar</button>
      <button mat-flat-button [mat-dialog-close]="true"
              [class]="data.action === 'desactivar' ? '!bg-amber-500 !text-slate-900 !font-semibold cursor-pointer' : '!bg-emerald-500 !text-slate-900 !font-semibold cursor-pointer'">
        <mat-icon>{{ data.action === 'desactivar' ? 'toggle_off' : 'toggle_on' }}</mat-icon>
        {{ data.action === 'desactivar' ? 'Desactivar' : 'Activar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmToggleDialogComponent {
  readonly data = inject<{ userName: string; action: string }>(MAT_DIALOG_DATA);
}

/* ─── Delete User Confirmation Dialog ─── */
@Component({
  selector: 'app-delete-user-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="!text-white flex items-center gap-2">
      <mat-icon class="text-red-400">warning</mat-icon>
      Eliminar usuario
    </h2>
    <mat-dialog-content>
      <p class="text-sm text-slate-300">
        ¿Estás seguro de que deseas eliminar al usuario <strong class="text-white">{{ data.user.displayName }}</strong>?
      </p>
      @if (data.assignedCount > 0) {
        <div class="mt-3 px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <mat-icon class="text-red-400 shrink-0" style="font-size:18px;width:18px;height:18px;margin-top:1px">assignment_late</mat-icon>
          <div>
            <p class="text-xs text-red-300 font-medium">
              Este usuario tiene <strong>{{ data.assignedCount }} departamentos</strong> asignados para medición.
            </p>
            <p class="text-xs text-red-300/70 mt-1">
              Al eliminarlo, estos departamentos quedarán sin operador asignado y deberás redistribuirlos.
            </p>
          </div>
        </div>
      }
      @if (data.user.role === 'admin') {
        <div class="mt-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
          <mat-icon class="text-amber-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">shield</mat-icon>
          <p class="text-xs text-amber-300">Este usuario es <strong>administrador</strong>. Asegúrate de que haya al menos otro admin activo.</p>
        </div>
      }
      <p class="text-xs text-slate-500 mt-3">Esta acción no se puede deshacer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cancelar</button>
      <button mat-flat-button [mat-dialog-close]="true"
              class="!bg-red-500 !text-white !font-semibold cursor-pointer">
        <mat-icon>delete</mat-icon> Eliminar usuario
      </button>
    </mat-dialog-actions>
  `,
})
export class DeleteUserDialogComponent {
  readonly data = inject<{ user: AppUser; assignedCount: number }>(MAT_DIALOG_DATA);
}
