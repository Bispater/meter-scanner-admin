import { Component, inject, computed, signal } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QrService, QrCode } from '../../core/services/qr.service';
import { BuildingService } from '../../core/services/building.service';
import { NotificationService } from '../../core/services/notification.service';
import { Apartment, Tower } from '../../core/models/building.model';
import { QrThumbCellComponent } from './qr-thumb-cell.component';

type TowerTableRow = {
  tower: Tower;
  apartments: { apt: Apartment; qr: QrCode | null }[];
};

@Component({
  selector: 'app-qr-management',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule, QrThumbCellComponent],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-white">Gestión de QRs</h2>
          <p class="text-slate-400 text-sm mt-1 max-w-2xl">
            Cada fila genera su miniatura en el navegador (mismo JSON que el servidor); la caché local evita recalcular al volver.
            Puedes colapsar cada torre para ver el resumen.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          @if (qrMatchCount() > 0) {
            <button mat-stroked-button class="!border-cyan-500/50 !text-cyan-300 !text-sm"
                    matTooltip="Hoja lista para imprimir o guardar como PDF"
                    (click)="exportAllQrSheet()">
              <mat-icon>print</mat-icon>
              Exportar hoja (todos)
            </button>
          }
          @if (missingCount() > 0 && !generating()) {
            <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold" (click)="runSync()" [disabled]="generating()">
              <mat-icon>auto_fix_high</mat-icon>
              Generar {{ missingCount() }} faltante{{ missingCount() === 1 ? '' : 's' }}
            </button>
          }
        </div>
      </div>

      @if (generating()) {
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800 border border-cyan-500/25">
          <mat-spinner diameter="24" class="!text-cyan-400" />
          <span class="text-slate-200 text-sm">
            Preparando imágenes QR… {{ syncProgress().done }} / {{ syncProgress().total || '…' }}
          </span>
        </div>
      }

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

              <!-- Tower subheader + dropdown -->
              <div class="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-slate-800/60">
                <button type="button"
                        class="flex items-center gap-2 flex-1 min-w-0 text-left rounded-lg hover:bg-slate-700/40 px-1 py-0.5 -mx-1 transition-colors"
                        (click)="toggleTower(t.tower.id)">
                  <mat-icon class="text-slate-400 shrink-0" style="font-size:22px;width:22px;height:22px;">
                    {{ isTowerCollapsed(t.tower.id) ? 'expand_more' : 'expand_less' }}
                  </mat-icon>
                  <mat-icon class="text-indigo-400 shrink-0" style="font-size:16px;width:16px;height:16px;">apartment</mat-icon>
                  <span class="text-sm font-semibold text-slate-300">{{ t.tower.name }}</span>
                  <span class="text-xs text-slate-500">— {{ t.apartments.length }} depto{{ t.apartments.length !== 1 ? 's' : '' }}</span>
                </button>
                <button mat-stroked-button
                        type="button"
                        class="!border-slate-600 !text-slate-300 !text-xs !h-8 !min-w-0 shrink-0"
                        matTooltip="Hoja con varios QR por fila (imprimir o PDF)"
                        (click)="exportTowerQrSheet(b.building.name, t.tower.name, t.apartments); $event.stopPropagation()">
                  <mat-icon style="font-size:16px;width:16px;height:16px;">print</mat-icon>
                  Exportar torre
                </button>
              </div>

              @if (isTowerCollapsed(t.tower.id)) {
                <div class="px-5 py-3 text-sm text-slate-400 border-t border-slate-700/30 bg-slate-900/20">
                  <span class="text-slate-300 font-medium">Resumen:</span>
                  {{ towerSummaryLine(t) }}
                </div>
              }

              @if (!isTowerCollapsed(t.tower.id)) {
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

                      <!-- QR cell: miniatura por fila + lista global (caché) -->
                      <td class="px-3 py-3 text-center">
                        <app-qr-thumb-cell
                          [buildingName]="b.building.name"
                          [towerName]="t.tower.name"
                          [apt]="row.apt"
                          (picked)="openFullQr($event)"
                        />
                      </td>

                      <!-- Actions cell -->
                      <td class="px-5 py-3 text-right">
                        @if (resolvedQr(row, t.tower.name); as rq) {
                          <div class="inline-flex gap-1">
                            <button mat-icon-button class="!w-8 !h-8 !text-slate-400 hover:!text-white"
                                    matTooltip="Ver completo"
                                    (click)="openFullQr(rq)">
                              <mat-icon style="font-size:18px;width:18px;height:18px;">open_in_new</mat-icon>
                            </button>
                            <button mat-icon-button class="!w-8 !h-8 !text-slate-400 hover:!text-cyan-400"
                                    matTooltip="Descargar"
                                    (click)="downloadQr(rq)">
                              <mat-icon style="font-size:18px;width:18px;height:18px;">download</mat-icon>
                            </button>
                            <button mat-icon-button class="!w-8 !h-8 !text-slate-400 hover:!text-slate-200"
                                    matTooltip="Imprimir"
                                    (click)="printQr(rq, t.tower.name, row.apt.number)">
                              <mat-icon style="font-size:18px;width:18px;height:18px;">print</mat-icon>
                            </button>
                          </div>
                        } @else {
                          <span class="text-slate-600 text-xs">{{ generating() ? '…' : '—' }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
              }
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
export class QrManagementComponent {
  readonly qrService    = inject(QrService);
  readonly buildingService = inject(BuildingService);
  private  readonly dialog = inject(MatDialog);
  private  readonly notify = inject(NotificationService);

  readonly generating = signal(false);
  readonly syncProgress = signal<{ done: number; total: number }>({ done: 0, total: 0 });
  /** Tower ids whose table is collapsed (summary visible). */
  readonly collapsedTowerIds = signal<Set<string>>(new Set());

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

  constructor() {
    void (async () => {
      await this.qrService.init();
      await this.runSync();
      toObservable(this.buildingService.buildings)
        .pipe(debounceTime(350), takeUntilDestroyed())
        .subscribe(() => void this.scheduleSync());
    })();
  }

  private scheduleSync(): void {
    const buildings = this.buildingService.buildings();
    if (buildings.length === 0) return;
    void this.runSync();
  }

  toggleTower(towerId: string): void {
    this.collapsedTowerIds.update(s => {
      const n = new Set(s);
      if (n.has(towerId)) n.delete(towerId);
      else n.add(towerId);
      return n;
    });
  }

  isTowerCollapsed(towerId: string): boolean {
    return this.collapsedTowerIds().has(towerId);
  }

  towerSummaryLine(t: TowerTableRow): string {
    this.qrService.qrList();
    const n = t.apartments.length;
    const withQr = t.apartments.filter(r => this.resolvedQr(r, t.tower.name)).length;
    const withMeter = t.apartments.filter(r => r.apt.meterId?.trim()).length;
    return `${withQr}/${n} con imagen QR · ${withMeter} con medidor · ${n - withMeter} sin medidor`;
  }

  /** Fila de tabla + código en memoria/caché (actualiza cuando el thumb rellena el servicio). */
  resolvedQr(row: TowerTableRow['apartments'][0], towerName: string): QrCode | null {
    this.qrService.qrList();
    if (row.qr) return row.qr;
    const code = (row.apt.qrCode?.trim() || this.qrService.qrCodeForApartment(towerName, row.apt.number)).trim();
    return this.qrService.getByQrCode(code) ?? null;
  }

  exportTowerQrSheet(buildingName: string, towerName: string, rows: TowerTableRow['apartments']): void {
    const qrs = rows.map(r => this.resolvedQr(r, towerName)).filter((q): q is QrCode => q != null);
    if (qrs.length === 0) {
      this.notify.info('Aún no hay imágenes QR para esta torre (espera a que termine la carga o pulsa Generar).');
      return;
    }
    this.openQrPrintSheet(qrs, `${buildingName} — ${towerName}`);
  }

  exportAllQrSheet(): void {
    const aptCodes = new Set(this.buildingService.allApartments().map(a => a.qrCode ?? ''));
    const qrs = this.qrService.qrList().filter(q => aptCodes.has(q.qrCode));
    if (qrs.length === 0) {
      this.notify.info('No hay QRs listos para exportar.');
      return;
    }
    this.openQrPrintSheet(qrs, 'Todos los departamentos');
  }

  private openQrPrintSheet(qrs: QrCode[], title: string): void {
    const cards = qrs
      .map(
        q => `
      <div class="card">
        <img src="${q.dataUrl}" alt="" />
        <div class="code">${this.escapeHtml(q.qrCode)}</div>
        <div class="sub">${this.escapeHtml(q.building)} — ${this.escapeHtml(q.tower)}</div>
        <div class="sub">Depto ${this.escapeHtml(q.apartment)}</div>
        ${q.meterId ? `<div class="meter">Medidor: ${this.escapeHtml(q.meterId)}</div>` : '<div class="meter muted">Sin medidor</div>'}
      </div>`,
      )
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${this.escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; color: #111; background: #fff; }
  h1 { font-size: 1.15rem; margin: 0 0 20px; font-weight: 600; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 960px; margin: 0 auto; }
  @media (max-width: 720px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  .card { text-align: center; border: 1px solid #ddd; border-radius: 10px; padding: 14px 10px; break-inside: avoid; page-break-inside: avoid; }
  img { width: 150px; height: 150px; object-fit: contain; display: block; margin: 0 auto; }
  .code { font-weight: 700; font-size: 14px; margin-top: 10px; font-family: ui-monospace, monospace; }
  .sub { font-size: 11px; color: #333; margin-top: 4px; line-height: 1.35; }
  .meter { font-size: 11px; color: #444; margin-top: 6px; }
  .meter.muted { color: #888; }
  @media print { body { padding: 12px; } .grid { gap: 14px; } }
</style></head><body>
  <h1>${this.escapeHtml(title)}</h1>
  <div class="grid">${cards}</div>
  <script>setTimeout(function(){ window.print(); }, 350);</script>
</body></html>`;
    const w = window.open('', '_blank');
    if (!w) {
      this.notify.error('Permite ventanas emergentes para exportar la hoja.');
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async runSync(): Promise<void> {
    if (this.generating()) return;
    await new Promise<void>(r => requestAnimationFrame(() => r()));
    const buildings = this.buildingService.buildings();
    if (buildings.length === 0) return;
    this.generating.set(true);
    this.syncProgress.set({ done: 0, total: 0 });
    try {
      await this.qrService.syncMissingFromBuildings(buildings, (done, total) => {
        this.syncProgress.set({ done, total });
      });
    } finally {
      this.generating.set(false);
    }
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
    const buildingLabel = qr.building || '';
    w.document.write(`
      <html><head><title>QR ${qr.qrCode}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;}
      img{width:300px;height:300px;} h2,p{margin:4px 0;}</style></head>
      <body>
        <h2>Depto: ${qr.qrCode}</h2>
        <p>${buildingLabel} — ${tower} — Depto ${apartment}</p>
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
      <p class="text-slate-400 text-xs mt-1">{{ data.building }} — {{ data.tower }} — Depto {{ data.apartment }}</p>
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
