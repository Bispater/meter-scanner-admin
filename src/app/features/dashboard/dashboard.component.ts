import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MeasurementService } from '../../core/services/measurement.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, RouterLink, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Dashboard</h2>
          <p class="text-slate-400 text-sm mt-1">Resumen de actividad del sistema</p>
        </div>
        <a routerLink="/app/measurements" mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold">
          <mat-icon>speed</mat-icon>
          Ver Mediciones
        </a>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        @for (card of summaryCards; track card.title) {
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-colors">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-slate-400 font-medium">{{ card.title }}</p>
                <p class="text-3xl font-bold mt-2" [class]="card.valueColor">{{ card.value }}</p>
                <p class="text-xs text-slate-500 mt-1">{{ card.subtitle }}</p>
              </div>
              <div class="w-11 h-11 rounded-lg flex items-center justify-center" [class]="card.iconBg">
                <mat-icon [class]="card.iconColor" style="font-size:22px;width:22px;height:22px;">{{ card.icon }}</mat-icon>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Recent Activity -->
      <div class="bg-slate-800 rounded-xl border border-slate-700">
        <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Últimas Mediciones</h3>
          <a routerLink="/app/measurements" class="text-cyan-400 text-sm hover:underline">Ver todas →</a>
        </div>
        <div class="divide-y divide-slate-700">
          @for (m of recentMeasurements; track m.id) {
            <div class="px-6 py-4 flex items-center gap-4 hover:bg-slate-700/30 transition-colors">
              <div class="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
                <mat-icon class="text-slate-400" style="font-size:20px;width:20px;height:20px;">speed</mat-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white">{{ m.tower }} — Depto {{ m.apartment }}</p>
                <p class="text-xs text-slate-400">Medidor: {{ m.meter_id }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold text-white">{{ m.reading_value }} m³</p>
                <p class="text-xs text-slate-500">{{ m.captured_at | date:'dd/MM HH:mm' }}</p>
              </div>
              <span
                class="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                [class]="m.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400' :
                         m.status === 'pending_review' ? 'bg-amber-500/15 text-amber-400' :
                         'bg-red-500/15 text-red-400'"
              >
                {{ m.status === 'verified' ? 'Validado' : m.status === 'pending_review' ? 'Pendiente' : 'Rechazado' }}
              </span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private readonly measurementService = inject(MeasurementService);

  readonly summary = this.measurementService.summary;
  readonly recentMeasurements = this.measurementService.measurements().slice(0, 5);

  get summaryCards() {
    const s = this.summary();
    return [
      {
        title: 'Lecturas Hoy',
        value: s.total_readings_today.toString(),
        subtitle: 'Mediciones registradas',
        icon: 'analytics',
        iconBg: 'bg-cyan-500/10',
        iconColor: 'text-cyan-400',
        valueColor: 'text-white',
      },
      {
        title: 'Alertas Pendientes',
        value: s.pending_alerts.toString(),
        subtitle: 'Requieren revisión',
        icon: 'warning',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
        valueColor: 'text-amber-400',
      },
      {
        title: 'Consumo Total',
        value: `${s.total_consumption_m3.toLocaleString()} m³`,
        subtitle: 'Acumulado del período',
        icon: 'water_drop',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-400',
        valueColor: 'text-white',
      },
    ];
  }
}
