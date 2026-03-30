import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { QrService } from '../../core/services/qr.service';

@Component({
  selector: 'app-qr-management',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatDialogModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Gestión de QRs</h2>
          <p class="text-slate-400 text-sm mt-1">Generar y administrar códigos QR de medidores</p>
        </div>
        <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon> Generar QR
        </button>
      </div>

      <!-- QR list -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (qr of qrService.qrList(); track qr.id) {
          <div class="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-cyan-500/30 transition-colors">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 bg-white rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                <img [src]="qr.dataUrl" [alt]="'QR ' + qr.meterId" class="w-full h-full object-contain" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-bold text-white truncate">Medidor: {{ qr.meterId }}</p>
                <p class="text-xs text-slate-400">{{ qr.tower }} — Depto {{ qr.apartment }}</p>
                <p class="text-xs text-slate-500 mt-1">Generado: {{ qr.generated }}</p>
              </div>
            </div>

            <!-- Expandable QR preview for scanning -->
            <div class="mt-3 flex justify-center">
              <img [src]="qr.dataUrl" [alt]="'QR ' + qr.meterId"
                   class="w-48 h-48 bg-white rounded-lg p-2 border border-slate-600 cursor-pointer hover:scale-105 transition-transform"
                   (click)="openFullQr(qr.dataUrl, qr.meterId)" />
            </div>

            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-700">
              <button mat-stroked-button class="!border-slate-600 !text-slate-400 text-xs flex-1"
                      (click)="downloadQr(qr)">
                <mat-icon style="font-size:16px;width:16px;height:16px;">download</mat-icon> Descargar
              </button>
              <button mat-stroked-button class="!border-slate-600 !text-slate-400 text-xs flex-1"
                      (click)="printQr(qr)">
                <mat-icon style="font-size:16px;width:16px;height:16px;">print</mat-icon> Imprimir
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class QrManagementComponent implements OnInit {
  readonly qrService = inject(QrService);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    this.qrService.init();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(QrCreateDialogComponent, {
      width: '440px',
      panelClass: 'dark-dialog',
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.qrService.addQr(result.tower, result.apartment);
      }
    });
  }

  downloadQr(qr: { dataUrl: string; meterId: string }): void {
    const link = document.createElement('a');
    link.href = qr.dataUrl;
    link.download = `QR_${qr.meterId}.png`;
    link.click();
  }

  printQr(qr: { dataUrl: string; meterId: string; tower: string; apartment: string }): void {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>QR ${qr.meterId}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;}
      img{width:300px;height:300px;} h2,p{margin:4px 0;}</style></head>
      <body>
        <h2>Medidor: ${qr.meterId}</h2>
        <p>${qr.tower} — Depto ${qr.apartment}</p>
        <img src="${qr.dataUrl}" />
        <script>setTimeout(()=>{window.print();},400);</script>
      </body></html>
    `);
    w.document.close();
  }

  openFullQr(dataUrl: string, meterId: string): void {
    this.dialog.open(QrPreviewDialogComponent, {
      data: { dataUrl, meterId },
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
      <p class="text-slate-300 text-sm mt-3">Medidor: {{ data.meterId }}</p>
      <p class="text-slate-500 text-xs mt-1">Escanea este QR con la app Flutter</p>
    </mat-dialog-content>
    <mat-dialog-actions align="center">
      <button mat-button mat-dialog-close class="!text-slate-400">Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class QrPreviewDialogComponent {
  readonly data = inject<{ dataUrl: string; meterId: string }>(MAT_DIALOG_DATA);
}

/* ─── Create-QR Dialog ─── */
@Component({
  selector: 'app-qr-create-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title class="!text-white">Generar nuevo QR</h2>
    <mat-dialog-content class="!pt-2 space-y-4">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Torre</mat-label>
        <mat-select [(ngModel)]="tower">
          @for (t of towers; track t) {
            <mat-option [value]="t">{{ t }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Departamento</mat-label>
        <input matInput [(ngModel)]="apartment" placeholder="Ej: 101" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close class="!text-slate-400">Cancelar</button>
      <button
        mat-flat-button
        class="!bg-cyan-500 !text-slate-900 !font-semibold"
        [disabled]="!tower || !apartment"
        [mat-dialog-close]="{ tower, apartment }"
      >
        <mat-icon>qr_code_2</mat-icon> Generar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }
  `],
})
export class QrCreateDialogComponent {
  readonly towers = inject(QrService).towers;
  tower = '';
  apartment = '';
}
