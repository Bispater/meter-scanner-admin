import { Component, inject, OnInit, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { DemoModeService } from '../../core/services/demo-mode.service';
import { BuildingService } from '../../core/services/building.service';
import { UserService } from '../../core/services/user.service';
import { MeasurementService } from '../../core/services/measurement.service';
import { CycleService } from '../../core/services/cycle.service';
import { OrganizationService } from '../../core/services/organization.service';
import { VersionCheckService } from '../../core/services/version-check.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-900">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-700">
          <mat-icon class="text-cyan-400 text-3xl" style="font-size:28px;width:28px;height:28px;">water_drop</mat-icon>
          <span class="text-lg font-bold text-white tracking-tight">Metscan</span>
          <span class="text-xs text-cyan-400 font-medium bg-cyan-400/10 px-2 py-0.5 rounded-full">Admin</span>
        </div>

        <!-- Nav Items -->
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          @for (item of navItems(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-cyan-500/15 text-cyan-400 border-l-cyan-400"
              class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors border-l-2 border-transparent"
            >
              <mat-icon class="text-xl" style="font-size:20px;width:20px;height:20px;">{{ item.icon }}</mat-icon>
              <span class="text-sm font-medium">{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Bottom -->
        <div class="p-4 border-t border-slate-700">
          <div class="text-xs text-slate-500 text-center">
            Metscan v1.0 — MVP
            <span class="block text-[10px] text-slate-600 mt-0.5">build {{ versionCheck.currentVersion }}</span>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Aviso de nueva versión desplegada -->
        @if (versionCheck.updateAvailable()) {
          <div class="flex items-center justify-center gap-2 bg-cyan-500/15 border-b border-cyan-500/30 px-4 py-2 shrink-0">
            <mat-icon class="text-cyan-300" style="font-size:16px;width:16px;height:16px;">system_update_alt</mat-icon>
            <span class="text-cyan-200 text-xs font-semibold">Hay una nueva versión disponible.</span>
            <button
              class="text-xs font-bold text-cyan-300 underline underline-offset-2 cursor-pointer bg-transparent border-0 hover:text-cyan-100"
              (click)="versionCheck.reloadApp()"
            >
              Haz clic aquí para actualizar
            </button>
          </div>
        }
        <!-- Demo mode banner -->
        @if (demoMode.isActive()) {
          <div class="flex items-center justify-center gap-2 bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 shrink-0">
            <mat-icon class="text-amber-400" style="font-size:16px;width:16px;height:16px;">science</mat-icon>
            <span class="text-amber-400 text-xs font-semibold">MODO DEMO</span>
            <span class="text-amber-400/70 text-xs">— Los datos son ficticios y se reinician al recargar la página.</span>
          </div>
        }
        <!-- Toolbar -->
        <header class="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <h1 class="text-base font-semibold text-slate-200">Panel de Administración</h1>
          <div class="flex items-center gap-3">
            @if (authService.user()?.organizationName) {
              <span class="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-700/60 border border-slate-600 rounded-full px-3 py-1">
                <mat-icon style="font-size:13px;width:13px;height:13px;" class="text-cyan-400">business</mat-icon>
                {{ authService.user()?.organizationName }}
              </span>
            }
            <div class="flex items-center gap-2 bg-slate-700/50 rounded-full px-3 py-1.5 cursor-pointer" [matMenuTriggerFor]="userMenu">
              <mat-icon style="font-size:18px;width:18px;height:18px;" class="text-cyan-400">admin_panel_settings</mat-icon>
              <span class="text-sm text-slate-300">{{ authService.user()?.displayName }}</span>
              <mat-icon style="font-size:18px;width:18px;height:18px;" class="text-slate-400">expand_more</mat-icon>
            </div>
            <mat-menu #userMenu="matMenu">
              <div class="px-4 py-2 border-b border-slate-700">
                <p class="text-xs text-slate-400">{{ authService.user()?.organizationName ?? 'Sin organización' }}</p>
              </div>
              <button mat-menu-item (click)="onLogout()">
                <mat-icon>logout</mat-icon>
                <span>Cerrar Sesión</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Page Content -->
        <main class="relative flex-1 overflow-y-auto p-6 bg-slate-900">
          @if (dataLoading()) {
            <div
              class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-slate-900/85 backdrop-blur-[1px]"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <mat-spinner diameter="40" />
              <span class="text-sm text-slate-400">Cargando datos…</span>
            </div>
          }
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
  `],
})
export class MainLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly demoMode = inject(DemoModeService);
  private readonly router = inject(Router);
  private readonly buildingService = inject(BuildingService);
  private readonly userService = inject(UserService);
  private readonly measurementService = inject(MeasurementService);
  private readonly cycleService = inject(CycleService);
  private readonly organizationService = inject(OrganizationService);
  readonly versionCheck = inject(VersionCheckService);

  /**
   * Overlay until each service’s first list load completes (not on every refetch after CRUD).
   * Las mediciones NO bloquean el ingreso: se cargan bajo demanda cuando el usuario
   * aplica un filtro en la pantalla de Mediciones (el Dashboard usa /summary/, liviano).
   */
  readonly dataLoading = computed(() => {
    const orgPending =
      this.authService.isSuperAdmin() && this.organizationService.initialLoadPending();
    return (
      this.buildingService.initialLoadPending() ||
      this.userService.initialLoadPending() ||
      this.cycleService.initialLoadPending() ||
      orgPending
    );
  });

  ngOnInit(): void {
    this.buildingService.loadAll();
    this.userService.loadAll();
    // No se precargan filas de mediciones: el Dashboard solo necesita los agregados
    // del endpoint de resumen; la tabla de Mediciones carga cuando el usuario filtra.
    this.measurementService.loadDashboardSummary();
    this.cycleService.loadAll();
    if (this.authService.isSuperAdmin()) {
      this.organizationService.loadAll();
    }
    // Aviso de despliegues nuevos sin que la clienta tenga que recargar a mano.
    this.versionCheck.start();
  }

  readonly navItems = () => {
    const base = [
      { route: '/app/dashboard', icon: 'dashboard', label: 'Dashboard' },
      { route: '/app/buildings', icon: 'domain', label: 'Edificios' },
      { route: '/app/users', icon: 'people', label: 'Usuarios' },
      { route: '/app/cycles', icon: 'event_repeat', label: 'Ciclos' },
      { route: '/app/measurements', icon: 'speed', label: 'Mediciones' },
      { route: '/app/qr-management', icon: 'qr_code_2', label: 'Gestión de QRs' },
    ];
    if (this.authService.isSuperAdmin()) {
      base.push({ route: '/app/organizations', icon: 'corporate_fare', label: 'Organizaciones' });
    }
    return base;
  };

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
