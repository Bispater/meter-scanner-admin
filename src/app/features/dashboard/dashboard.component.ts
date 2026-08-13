import {
  Component, inject, ViewChild, ElementRef,
  AfterViewInit, OnDestroy, effect, computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MeasurementService } from '../../core/services/measurement.service';
import { DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
        @for (card of summaryCards(); track card.title) {
          @if (card.link) {
            <a [routerLink]="card.link" [queryParams]="card.queryParams"
               class="block bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-amber-500/50 hover:bg-slate-800/80 transition-colors cursor-pointer no-underline">
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
            </a>
          } @else {
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
        }
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Bar chart: monthly readings -->
        <div class="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 class="text-sm font-semibold text-white mb-4">Mediciones por mes</h3>
          <div style="position:relative;height:220px">
            <canvas #barChart></canvas>
          </div>
        </div>

        <!-- Donut chart: by status -->
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
          <h3 class="text-sm font-semibold text-white mb-4">Estado de mediciones</h3>
          <div class="flex-1 flex items-center justify-center" style="position:relative;height:200px">
            <canvas #donutChart></canvas>
          </div>
          <!-- Legend -->
          <div class="flex justify-center gap-4 mt-4 flex-wrap">
            @for (l of statusLegend; track l.label) {
              <div class="flex items-center gap-1.5 text-xs text-slate-400">
                <span class="w-2.5 h-2.5 rounded-full" [style.background]="l.color"></span>
                {{ l.label }}
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-slate-800 rounded-xl border border-slate-700">
        <div class="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h3 class="text-base font-semibold text-white">Últimas Mediciones</h3>
          <a routerLink="/app/measurements" class="text-cyan-400 text-sm hover:underline">Ver todas →</a>
        </div>
        <div class="divide-y divide-slate-700">
          @for (m of recentMeasurements(); track m.id) {
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
          @empty {
            <p class="px-6 py-8 text-center text-slate-500 text-sm">Sin mediciones recientes</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  private readonly measurementService = inject(MeasurementService);

  @ViewChild('barChart')   barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart') donutChartRef!: ElementRef<HTMLCanvasElement>;

  private barChart?: Chart;
  private donutChart?: Chart;

  // El Dashboard usa el endpoint de resumen (todo el histórico) para no depender del
  // mes acotado que carga la tabla de mediciones.
  readonly recentMeasurements = computed(() =>
    this.measurementService.dashboardSummary()?.recent ?? [],
  );

  readonly statusLegend = [
    { label: 'Verificado', color: '#10b981' },
    { label: 'Pendiente',  color: '#f59e0b' },
    { label: 'Rechazado',  color: '#ef4444' },
  ];

  constructor() {
    // Re-draw charts whenever the dashboard summary changes
    effect(() => {
      const summary = this.measurementService.dashboardSummary();
      if (summary && this.barChart && this.donutChart) {
        this._updateCharts();
      }
    });
  }

  readonly summaryCards = computed(() => {
    const summary = this.measurementService.dashboardSummary();
    const counts = summary?.statusCounts ?? { verified: 0, pending_review: 0, rejected: 0 };
    const pending = counts.pending_review;
    const verified = counts.verified;
    const rejected = counts.rejected;
    const total = pending + verified + rejected;
    const verifiedRecent = summary?.verifiedLast30Days ?? 0;

    const validationRate = total > 0 ? Math.round((verified / total) * 100) : 0;
    const rejectedLabel = rejected === 1 ? '1 rechazada' : `${rejected} rechazadas`;

    return [
      {
        title: 'Pendientes',
        value: pending.toString(),
        subtitle: pending === 0 ? 'Sin pendientes' : 'Mediciones por validar',
        icon: 'pending_actions',
        iconBg: 'bg-amber-500/10',
        iconColor: 'text-amber-400',
        valueColor: 'text-amber-400',
        link: '/app/measurements' as string | null,
        // Aterriza en Mediciones ya filtrado a pendientes (carga solo esas filas).
        queryParams: { status: 'pending' } as Record<string, string> | undefined,
      },
      {
        title: 'Validadas (30 días)',
        value: verifiedRecent.toString(),
        subtitle: `${verified} validadas en total`,
        icon: 'verified',
        iconBg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-400',
        valueColor: 'text-white',
        link: null as string | null,
        queryParams: undefined as Record<string, string> | undefined,
      },
      {
        title: 'Tasa de validación',
        value: total > 0 ? `${validationRate}%` : '—',
        subtitle: total > 0 ? `${rejectedLabel} · ${total} en total` : 'Sin datos aún',
        icon: 'trending_up',
        iconBg: 'bg-cyan-500/10',
        iconColor: 'text-cyan-400',
        valueColor: 'text-white',
        link: null as string | null,
        queryParams: undefined as Record<string, string> | undefined,
      },
    ];
  });

  ngAfterViewInit(): void {
    this._initCharts();
    // Refresca los agregados al entrar al Dashboard (el main-layout ya los cargó al
    // iniciar sesión, pero pueden haber cambiado al volver desde otra pantalla).
    this.measurementService.loadDashboardSummary();
    this._updateCharts();
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.donutChart?.destroy();
  }

  private _initCharts(): void {
    const gridColor = 'rgba(148,163,184,0.1)';
    const labelColor = '#94a3b8';

    // Bar chart
    this.barChart = new Chart(this.barChartRef.nativeElement, {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: labelColor, font: { size: 11 } },
            grid: { color: gridColor },
            border: { color: gridColor },
          },
          y: {
            beginAtZero: true,
            ticks: { color: labelColor, font: { size: 11 }, stepSize: 1 },
            grid: { color: gridColor },
            border: { color: gridColor },
          },
        },
      },
    });

    // Donut chart
    this.donutChart = new Chart(this.donutChartRef.nativeElement, {
      type: 'doughnut',
      data: { labels: ['Verificado', 'Pendiente', 'Rechazado'], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed}`,
            },
          },
        },
      },
    });
  }

  private _updateCharts(): void {
    const summary = this.measurementService.dashboardSummary();

    // ── Bar chart: last 6 months (desde el endpoint de resumen) ──
    const monthLabels: string[] = [];
    const monthCounts: number[] = [];
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

    for (const row of summary?.monthlyCounts ?? []) {
      monthLabels.push(`${months[row.month - 1]} ${row.year}`);
      monthCounts.push(row.count);
    }

    if (this.barChart) {
      this.barChart.data.labels = monthLabels;
      this.barChart.data.datasets = [{
        data: monthCounts,
        backgroundColor: 'rgba(34,211,238,0.25)',
        borderColor: '#22d3ee',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(34,211,238,0.45)',
      }];
      this.barChart.update('none');
    }

    // ── Donut chart: by status ──
    const counts = summary?.statusCounts ?? { verified: 0, pending_review: 0, rejected: 0 };
    const verified = counts.verified;
    const pending  = counts.pending_review;
    const rejected = counts.rejected;

    if (this.donutChart) {
      this.donutChart.data.datasets = [{
        data: [verified, pending, rejected],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderColor: '#1e293b',
        borderWidth: 3,
        hoverBorderWidth: 0,
      }];
      this.donutChart.update('none');
    }
  }
}
