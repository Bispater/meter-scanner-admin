import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { BuildingService } from '../../core/services/building.service';
import { UserService } from '../../core/services/user.service';
import { MeasurementService } from '../../core/services/measurement.service';

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
  ],
  template: `
    <div class="flex h-screen overflow-hidden bg-slate-900">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-800 border-r border-slate-700 flex flex-col shrink-0">
        <!-- Logo -->
        <div class="h-16 flex items-center gap-3 px-5 border-b border-slate-700">
          <mat-icon class="text-cyan-400 text-3xl" style="font-size:28px;width:28px;height:28px;">water_drop</mat-icon>
          <span class="text-lg font-bold text-white tracking-tight">HydroScan</span>
          <span class="text-xs text-cyan-400 font-medium bg-cyan-400/10 px-2 py-0.5 rounded-full">Admin</span>
        </div>

        <!-- Nav Items -->
        <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          @for (item of navItems; track item.route) {
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
          <div class="text-xs text-slate-500 text-center">HydroScan v1.0 — MVP</div>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Toolbar -->
        <header class="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shrink-0">
          <h1 class="text-base font-semibold text-slate-200">Panel de Administración</h1>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-slate-700/50 rounded-full px-3 py-1.5 cursor-pointer" [matMenuTriggerFor]="userMenu">
              <mat-icon style="font-size:18px;width:18px;height:18px;" class="text-cyan-400">admin_panel_settings</mat-icon>
              <span class="text-sm text-slate-300">{{ authService.user()?.displayName }}</span>
              <mat-icon style="font-size:18px;width:18px;height:18px;" class="text-slate-400">expand_more</mat-icon>
            </div>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="onLogout()">
                <mat-icon>logout</mat-icon>
                <span>Cerrar Sesión</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto p-6 bg-slate-900">
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
  private readonly router = inject(Router);
  private readonly buildingService = inject(BuildingService);
  private readonly userService = inject(UserService);
  private readonly measurementService = inject(MeasurementService);

  ngOnInit(): void {
    this.buildingService.loadAll();
    this.userService.loadAll();
    this.measurementService.loadAll();
  }

  readonly navItems = [
    { route: '/app/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { route: '/app/buildings', icon: 'domain', label: 'Edificios' },
    { route: '/app/users', icon: 'people', label: 'Usuarios' },
    { route: '/app/measurements', icon: 'speed', label: 'Mediciones' },
    { route: '/app/qr-management', icon: 'qr_code_2', label: 'Gestión de QRs' },
  ];

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
