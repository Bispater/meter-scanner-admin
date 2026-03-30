import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MeasurementService } from '../../core/services/measurement.service';

@Component({
  selector: 'app-towers',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-white">Torres / Departamentos</h2>
        <p class="text-slate-400 text-sm mt-1">Gestión de edificios y unidades</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        @for (tower of towerData; track tower.name) {
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-cyan-500/30 transition-colors">
            <div class="flex items-start justify-between mb-4">
              <div class="w-11 h-11 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <mat-icon class="text-cyan-400" style="font-size:22px;width:22px;height:22px;">apartment</mat-icon>
              </div>
              <span class="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">{{ tower.apartments }} dptos</span>
            </div>
            <h3 class="text-lg font-bold text-white">{{ tower.name }}</h3>
            <p class="text-sm text-slate-400 mt-1">{{ tower.readings }} lecturas registradas</p>
            <div class="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
              <span class="text-xs text-slate-500">Última lectura: {{ tower.lastReading }}</span>
              <button mat-icon-button class="!text-slate-400 hover:!text-cyan-400">
                <mat-icon style="font-size:18px;width:18px;height:18px;">chevron_right</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class TowersComponent {
  private readonly measurementService = inject(MeasurementService);

  readonly towerData = [
    { name: 'Torre A', apartments: 24, readings: 18, lastReading: '26/03 14:30' },
    { name: 'Torre B', apartments: 30, readings: 15, lastReading: '26/03 15:10' },
    { name: 'Torre C', apartments: 18, readings: 12, lastReading: '26/03 11:20' },
  ];
}
