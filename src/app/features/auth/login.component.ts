import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-500/10 mb-4">
            <mat-icon class="text-cyan-400" style="font-size:36px;width:36px;height:36px;">water_drop</mat-icon>
          </div>
          <h1 class="text-2xl font-bold text-white">Metscan Admin</h1>
          <p class="text-slate-400 text-sm mt-1">Panel de administración de medidores</p>
        </div>

        <!-- Demo shortcut -->
        @if (isDemoMode()) {
          <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-5 text-center">
            <div class="flex items-center justify-center gap-2 mb-2">
              <mat-icon class="text-amber-400" style="font-size:20px;width:20px;height:20px;">science</mat-icon>
              <span class="text-amber-400 font-semibold text-sm">Modo Demo</span>
            </div>
            <p class="text-slate-400 text-xs mb-4">Explora el panel con datos de ejemplo. Los cambios no se guardan.</p>
            <button
              mat-flat-button
              class="w-full !bg-amber-500 !text-slate-900 !font-bold !rounded-xl !py-2"
              type="button"
              [disabled]="loading()"
              (click)="onDemoLogin()"
            >
              @if (loading()) {
                <span class="inline-flex items-center justify-center gap-2">
                  <mat-spinner diameter="20" />
                  Conectando…
                </span>
              } @else {
                Entrar al demo ahora
              }
            </button>
          </div>
        }

        <!-- Card -->
        <div class="bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h2 class="text-lg font-semibold text-white mb-6">Iniciar Sesión</h2>

          <form (ngSubmit)="onLogin()" class="space-y-5">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Usuario</mat-label>
              <input matInput [(ngModel)]="username" name="username" placeholder="admin" autocomplete="username" [disabled]="loading()" />
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Contraseña</mat-label>
              <input matInput [(ngModel)]="password" name="password"
                [type]="hidePassword() ? 'password' : 'text'"
                placeholder="••••••" autocomplete="current-password"
                [disabled]="loading()" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" [disabled]="loading()" (click)="hidePassword.set(!hidePassword())">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            @if (errorMessage()) {
              <div class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg flex items-center gap-2">
                <mat-icon style="font-size:18px;width:18px;height:18px;">error</mat-icon>
                {{ errorMessage() }}
              </div>
            }

            <button
              mat-flat-button
              class="w-full !bg-cyan-500 !text-slate-900 !font-semibold !py-3 !rounded-lg"
              type="submit"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span class="inline-flex items-center justify-center gap-2">
                  <mat-spinner diameter="22" />
                  Iniciando sesión…
                </span>
              } @else {
                Ingresar
              }
            </button>
          </form>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  username = '';
  password = '';
  hidePassword = signal(true);
  errorMessage = signal('');
  isDemoMode = signal(false);

  loading = signal(false);

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(p => {
      if (p.get('demo') === '1') this.isDemoMode.set(true);
    });
  }

  async onDemoLogin(): Promise<void> {
    this.loading.set(true);
    const success = await this.authService.login('admin', 'admin', true);
    this.loading.set(false);
    if (success) this.router.navigate(['/app/dashboard']);
  }

  async onLogin(): Promise<void> {
    this.errorMessage.set('');
    if (!this.username || !this.password) {
      this.errorMessage.set('Complete todos los campos.');
      return;
    }
    this.loading.set(true);
    const success = await this.authService.login(this.username, this.password, false);
    this.loading.set(false);
    if (success) {
      this.router.navigate(['/app/dashboard']);
    } else {
      this.errorMessage.set('Credenciales inválidas. Intente nuevamente.');
    }
  }
}
