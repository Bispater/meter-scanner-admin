import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../core/services/user.service';
import { BuildingService } from '../../core/services/building.service';
import { AppUser, UserRole } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

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
        <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold" (click)="openCreateDialog()">
          <mat-icon>person_add</mat-icon> Nuevo Usuario
        </button>
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
                  <button mat-stroked-button class="!border-slate-600 !text-slate-400 text-xs"
                          (click)="openAssignDialog(user)">
                    <mat-icon style="font-size:16px;width:16px;height:16px;">assignment</mat-icon>
                    {{ user.assignedApartmentIds.length }} asignados
                  </button>
                }
                <button mat-icon-button class="!text-slate-400 hover:!text-cyan-400" (click)="openEditDialog(user)">
                  <mat-icon style="font-size:18px;width:18px;height:18px;">edit</mat-icon>
                </button>
                <button mat-icon-button class="!text-slate-400 hover:!text-amber-400" (click)="toggleActive(user)">
                  <mat-icon style="font-size:18px;width:18px;height:18px;">
                    {{ user.active ? 'toggle_on' : 'toggle_off' }}
                  </mat-icon>
                </button>
              </div>
            </div>

            <!-- Assigned apartments preview -->
            @if (user.role === 'operator' && user.assignedApartmentIds.length > 0) {
              <div class="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-1.5">
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
    </div>
  `,
})
export class UsersComponent {
  readonly userService = inject(UserService);
  private readonly buildingService = inject(BuildingService);
  private readonly dialog = inject(MatDialog);
  private readonly http = inject(HttpClient);

  countAdmins(): number {
    return this.userService.users().filter(u => u.role === 'admin').length;
  }

  getAssignedApartments(user: AppUser) {
    const all = this.buildingService.allApartments();
    return all.filter(a => user.assignedApartmentIds.includes(a.id));
  }

  toggleActive(user: AppUser): void {
    this.userService.toggleActive(user.id);
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

  openAssignDialog(user: AppUser): void {
    const http = this.http;
    const url = `${environment.apiUrl}/accounts/users/${user.id}/protected-apartments/`;
    http.get<{ protected_apartment_ids: number[] }>(url).subscribe({
      next: res => {
        const protectedIds = (res.protected_apartment_ids || []).map(String);
        const ref = this.dialog.open(AssignApartmentsDialogComponent, {
          width: '640px',
          panelClass: 'dark-dialog',
          data: { user, protectedIds },
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
          data: { user, protectedIds: [] },
        });
        ref.afterClosed().subscribe(result => {
          if (result !== undefined) this.userService.assignApartments(user.id, result);
        });
      },
    });
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

      @if (protectedIds.length > 0) {
        <div class="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
          <mat-icon class="text-amber-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">lock</mat-icon>
          <p class="text-xs text-amber-300">
            Los departamentos con <mat-icon style="font-size:12px;width:12px;height:12px;vertical-align:middle" class="text-amber-400">lock</mat-icon>
            tienen mediciones verificadas y no pueden ser removidos.
          </p>
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
                            [disabled]="isProtected(apt.id)"
                            [matTooltip]="isProtected(apt.id) ? 'Tiene medición verificada — no se puede remover' : ''"
                            (click)="toggle(apt.id)">
                      {{ apt.number }}
                      @if (isProtected(apt.id)) {
                        <mat-icon class="text-amber-400 !w-3 !h-3 absolute -top-1 -right-1" style="font-size:10px">lock</mat-icon>
                      }
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <p class="text-xs text-slate-500 mt-3">
        {{ selectedIds.length }} departamentos seleccionados
        @if (protectedIds.length > 0) {
          · <span class="text-amber-400">{{ protectedIds.length }} protegidos</span>
        }
      </p>
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
  readonly data = inject<{ user: AppUser; protectedIds?: string[] }>(MAT_DIALOG_DATA);
  private readonly buildingService = inject(BuildingService);

  readonly buildings = this.buildingService.buildings;
  selectedIds: string[] = [...this.data.user.assignedApartmentIds];
  protectedIds: string[] = this.data.protectedIds ?? [];

  isSelected(id: string): boolean { return this.selectedIds.includes(id); }
  isProtected(id: string): boolean { return this.protectedIds.includes(id); }

  btnClass(id: string): string {
    if (this.isProtected(id)) return 'bg-amber-500/15 border-amber-500/50 text-amber-300 cursor-not-allowed';
    if (this.isSelected(id)) return 'bg-cyan-500/20 border-cyan-500 text-cyan-300 cursor-pointer';
    return 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 cursor-pointer';
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
    const toAdd = ids.filter(id => !this.isSelected(id));
    this.selectedIds = [...this.selectedIds, ...toAdd];
  }

  deselectTower(tower: { apartments: { id: string }[] }): void {
    const ids = tower.apartments.map(a => a.id);
    this.selectedIds = this.selectedIds.filter(id => !ids.includes(id) || this.isProtected(id));
  }

  selectAll(): void {
    this.selectedIds = this.buildingService.allApartments().map(a => a.id);
  }

  clearAll(): void {
    this.selectedIds = [...this.protectedIds];
  }
}
