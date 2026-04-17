import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QrService, QrCode } from '../../core/services/qr.service';
import { Apartment } from '../../core/models/building.model';

/**
 * Genera y muestra la miniatura QR por fila (no depende solo del listado global),
 * para que la imagen aparezca aunque la sync masiva se retrase o falle.
 */
@Component({
  selector: 'app-qr-thumb-cell',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (qr()) {
      <img
        [src]="qr()!.dataUrl"
        class="w-10 h-10 bg-white rounded p-0.5 mx-auto cursor-pointer hover:scale-110 transition-transform border border-slate-600"
        [alt]="'QR ' + qr()!.qrCode"
        (click)="picked.emit(qr()!)"
      />
    } @else if (failed()) {
      <span class="inline-flex items-center gap-1 text-amber-400/70 text-xs">—</span>
    } @else {
      <mat-spinner diameter="20" class="!mx-auto" />
    }
  `,
})
export class QrThumbCellComponent implements OnInit {
  private readonly qrService = inject(QrService);

  buildingName = input.required<string>();
  towerName = input.required<string>();
  apt = input.required<Apartment>();

  picked = output<QrCode>();

  readonly qr = signal<QrCode | null>(null);
  readonly failed = signal(false);

  ngOnInit(): void {
    const a = this.apt();
    void this.qrService
      .addQr(
        this.buildingName(),
        this.towerName(),
        a.number,
        a.meterId,
        a.readingLayout,
        +a.id,
        a.qrCode ?? null,
      )
      .then(q => this.qr.set(q))
      .catch(() => this.failed.set(true));
  }
}
