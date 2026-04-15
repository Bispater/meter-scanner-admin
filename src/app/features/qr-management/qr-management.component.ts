import { Component, inject, computed, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { QrService, QrCode } from '../../core/services/qr.service';
import { BuildingService } from '../../core/services/building.service';

@Component({
  selector: 'app-qr-management',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule, MatTooltipModule],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Gestión de QRs</h2>
          <p class="text-slate-400 text-sm mt-1">Códigos QR generados por edificio, torre y departamento</p>
        </div>
        @if (missingCount() > 0) {
          <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold" (click)="generateAllMissing()" [disabled]="generating()">
            <mat-icon>auto_fix_high</mat-icon>
            Generar {{ missingCount() }} faltante{{ missingCount() === 1 ? '' : 's' }}
          </button>
        }
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
            <mat-icon class="text-cyan-400" style="font-size:18px;width:18px;height:18px;">door_front</mat-icon>
          </div>
          <div>
            <p class="text-xl font-bold text-white">{{ totalApts() }}</p>
            <p class="text-xs text-slate-400">Departamentos</p>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <mat-icon class="text-emerald-400" style="font-size:18px;width:18px;height:18px;">qr_code_2</mat-icon>
          </div>
          <div>
            <p class="text-xl font-bold text-white">{{ qrMatchCount() }}</p>
            <p class="text-xs text-slate-400">QRs generados</p>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
               [class]="missingCount() > 0 ? 'bg-amber-500/10' : 'bg-slate-700'">
            <mat-icon style="font-size:18px;width:18px;height:18px;"
                      [class]="missingCount() > 0 ? 'text-amber-400' : 'text-slate-500'">warning_amber</mat-icon>
          </div>
          <div>
            <p class="text-xl font-bold" [class]="missingCount() > 0 ? 'text-amber-400' : 'text-slate-400'">{{ missingCount() }}</p>
            <p class="text-xs text-slate-400">Sin QR</p>
          </div>
        </div>
      </div>

      <!-- Building sections -->
      @for (b of tableData(); track b.building.id) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">

          <!-- Building header -->
          <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-700 bg-slate-800">
            <mat-icon class="text-cyan-400" style="font-size:20px;width:20px;height:20px;">domain</mat-icon>
            <div>
              <span class="font-bold text-white">{{ b.building.name }}</span>
              <span class="text-slate-500 text-xs ml-2">{{ b.building.address }}</span>
            </div>
          </div>

          <!-- Tower sections -->
          @for (t of b.towers; track t.tower.id) {
            <div class="border-b border-slate-700/50 last:border-b-0">

              <!-- Tower subheader -->
              <div class="flex items-center gap-2 px-5 py-2.5 bg-slate-800/60">
                <mat-icon class="text-indigo-400" style="font-size:16px;width:16px;height:16px;">apartment</mat-icon>
                <span class="text-sm font-semibold text-slate-300">{{ t.tower.name }}</span>
                <span class="text-xs text-slate-500 ml-1">— {{ t.apartments.length }} depto{{ t.apartments.length !== 1 ? 's' : '' }}</span>
              </div>

              <!-- Apartments table -->
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-slate-700/50">
                    <th class="text-left px-5 py-2 text-xs text-slate-500 font-medium w-20">Depto</th>
                    <th class="text-left px-3 py-2 text-xs text-slate-500 font-medium w-16">Piso</th>
                    <th class="text-left px-3 py-2 text-xs text-slate-500 font-medium">Código QR / Medidor</th>
                    <th class="text-center px-3 py-2 text-xs text-slate-500 font-medium w-24">QR</th>
                    <th class="text-right px-5 py-2 text-xs text-slate-500 font-medium w-40">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of t.apartments; track row.apt.id) {
                    <tr class="border-b border-slate-700/30 last:border-b-0 hover:bg-slate-700/20 transition-colors">
                      <td class="px-5 py-3 font-semibold text-white">{{ row.apt.number }}</td>
                      <td class="px-3 py-3 text-slate-400">P{{ row.apt.floor }}</td>
                      <td class="px-3 py-3 font-mono text-xs">
                        <span class="text-cyan-400 font-semibold">{{ row.apt.qrCode }}</span>
                        @if (row.apt.meterId) {
                          <span class="text-slate-500 block text-[10px]">{{ row.apt.meterId }}</span>
                        }
                      </td>

                      <!-- QR cell -->
                      <td class="px-3 py-3 text-center">
                        @if (row.qr) {
                          <img [src]="row.qr.dataUrl"
                               class="w-10 h-10 bg-white rounded p-0.5 mx-auto cursor-pointer hover:scale-110 transition-transform border border-slate-600"
                               [alt]="'QR ' + row.apt.qrCode"
                               (click)="openFullQr(row.qr)" />
                        } @else {
                          <span class="inline-flex items-center gap-1 text-amber-400/70 text-xs">
                            <mat-icon style="font-size:13px;width:13px;height:13px;">radio_button_unchecked</mat-icon>
                            Sin QR
                          </span>
                        }
                      </td>

                      <!-- Actions cell -->
                      <td class="px-5 py-3 text-right">
                        @if (row.qr) {
                          <div class="inline-flex gap-1">
                            <button mat-icon-button class="!w-8 !h-8 !text-slate-400 hover:!text-white"
                                    matTooltip="Ver completo"
                                    (click)="openFullQr(row.qr!)">
                              <mat-icon style="font-size:18px;width:18px;height:18px;">open_in_new</mat-icon>
                            </button>
                            <button mat-icon-button class="!w-8 !h-8 !text-slate-400 hover:!text-cyan-400"
                                    matTooltip="Descargar"
                                    (click)="downloadQr(row.qr!)">
                              <mat-icon style="font-size:18px;width:18px;height:18px;">download</mat-icon>
                            </button>
                            <button mat-icon-button class="!w-8 !h-8 !text-slate-400 hover:!text-slate-200"
                                    matTooltip="Imprimir"
                                    (click)="printQr(row.qr!, t.tower.name, row.apt.number)">
                              <mat-icon style="font-size:18px;width:18px;height:18px;">print</mat-icon>
                            </button>
                          </div>
                        } @else {
                          <button mat-stroked-button
                                  class="!border-cyan-500/40 !text-cyan-400 !text-xs !h-7 !px-3"
                                  (click)="generateForApt(t.tower.name, row.apt.number, row.apt.meterId || '', row.apt.readingLayout, +row.apt.id)">
                            <mat-icon style="font-size:14px;width:14px;height:14px;">qr_code_2</mat-icon>
                            Generar
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }

          @if (b.towers.length === 0) {
            <div class="p-8 text-center text-slate-500 text-sm">Sin torres registradas.</div>
          }
        </div>
      }

      @if (tableData().length === 0) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <mat-icon class="text-slate-600" style="font-size:48px;width:48px;height:48px;">qr_code</mat-icon>
          <p class="text-slate-400 mt-3">No hay edificios registrados. Crea uno primero en la sección Edificios.</p>
        </div>
      }
    </div>
  `,
})
export class QrManagementComponent implements OnInit {
  readonly qrService    = inject(QrService);
  readonly buildingService = inject(BuildingService);
  private  readonly dialog = inject(MatDialog);

  readonly generating = signal(false);

  readonly tableData = computed(() => {
    const qrByCode = new Map(this.qrService.qrList().map(q => [q.qrCode, q]));
    return this.buildingService.buildings().map(b => ({
      building: b,
      towers: b.towers.map(t => ({
        tower: t,
        apartments: t.apartments.map(a => ({
          apt: a,
          qr: qrByCode.get(a.qrCode ?? '') ?? null,
        })),
      })),
    }));
  });

  readonly totalApts = computed(() => this.buildingService.allApartments().length);

  readonly qrMatchCount = computed(() => {
    const aptCodes = new Set(this.buildingService.allApartments().map(a => a.qrCode ?? ''));
    return this.qrService.qrList().filter(q => aptCodes.has(q.qrCode)).length;
  });

  readonly missingCount = computed(() => {
    const codesWithQr = new Set(this.qrService.qrList().map(q => q.qrCode));
    return this.buildingService.allApartments().filter(a => !codesWithQr.has(a.qrCode ?? '')).length;
  });

  ngOnInit(): void {
    this.qrService.init();
  }

  async generateForApt(
    towerName: string,
    aptNumber: string,
    meterId: string,
    meterType: 'A' | 'B' = 'A',
    apartmentId?: number,
  ): Promise<void> {
    await this.qrService.addQr(towerName, aptNumber, meterId, meterType, apartmentId);
  }

  async generateAllMissing(): Promise<void> {
    this.generating.set(true);
    const codesWithQr = new Set(this.qrService.qrList().map(q => q.qrCode));
    for (const b of this.buildingService.buildings()) {
      for (const t of b.towers) {
        for (const a of t.apartments) {
          if (!codesWithQr.has(a.qrCode ?? '')) {
            await this.qrService.addQr(t.name, a.number, a.meterId, a.readingLayout, +a.id);
          }
        }
      }
    }
    this.generating.set(false);
  }

  downloadQr(qr: QrCode): void {
    const link = document.createElement('a');
    link.href = qr.dataUrl;
    link.download = `QR_${qr.qrCode}.png`;
    link.click();
  }

  printQr(qr: QrCode, tower: string, apartment: string): void {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>QR ${qr.qrCode}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;}
      img{width:300px;height:300px;} h2,p{margin:4px 0;}</style></head>
      <body>
        <h2>Depto: ${qr.qrCode}</h2>
        <p>${tower} — Depto ${apartment}</p>
        ${qr.meterId ? `<p style="color:#888;font-size:12px">Medidor: ${qr.meterId}</p>` : ''}
        <img src="${qr.dataUrl}" />
        <script>setTimeout(()=>{window.print();},400);</script>
      </body></html>
    `);
    w.document.close();
  }

  openFullQr(qr: QrCode): void {
    this.dialog.open(QrPreviewDialogComponent, {
      data: qr,
      panelClass: 'dark-dialog',
      width: '380px',
    });
  }
}

/* ─── Full-size QR Preview Dialog ─── */
@Component({
  selector: 'app-qr-preview-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <mat-dialog-content class="!flex !flex-col !items-center !py-4">
      <img [src]="data.dataUrl" class="w-72 h-72 bg-white rounded-lg p-3" />
      <p class="text-slate-300 text-sm mt-3 font-semibold">{{ data.qrCode }}</p>
      <p class="text-slate-400 text-xs mt-1">{{ data.tower }} — Depto {{ data.apartment }}</p>
      @if (data.meterId) {
        <p class="text-slate-500 text-xs mt-1">Medidor: {{ data.meterId }}</p>
      }
      <p class="text-slate-500 text-xs mt-2">Escanea este QR con la app</p>
    </mat-dialog-content>
    <mat-dialog-actions align="center">
      <button mat-button mat-dialog-close class="!text-slate-400">Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class QrPreviewDialogComponent {
  readonly data = inject<QrCode>(MAT_DIALOG_DATA);
}
