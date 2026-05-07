import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Measurement } from '../../core/models/measurement.model';
import { MeasurementService } from '../../core/services/measurement.service';
import { formatMeterReadingDisplay } from '../../shared/utils/meter-reading-format';
import { ImageLightboxDialogComponent } from './image-lightbox-dialog.component';

export interface MeasurementEditReadingDialogData {
  measurement: Measurement;
}

@Component({
  selector: 'app-measurement-edit-reading-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="flex flex-col bg-slate-800 text-slate-200 max-h-[90vh] max-w-[560px] w-[96vw]">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <h2 class="text-lg font-bold text-white">Corregir lectura</h2>
        <button mat-icon-button type="button" (click)="cancel()" class="cursor-pointer" [disabled]="loading()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        <p class="text-xs text-slate-500">
          Revise la foto del medidor y ajuste el valor si corresponde. La nota queda registrada en el historial.
        </p>

        <div
          class="w-full h-52 rounded-xl bg-slate-700 overflow-hidden flex items-center justify-center border border-slate-600 cursor-zoom-in relative group shrink-0"
          (click)="openLightbox()"
        >
          @if (measurement().photo_url) {
            <img
              [src]="measurement().photo_url"
              alt="Foto del medidor"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition-colors">
              <mat-icon
                class="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                style="font-size:28px;width:28px;height:28px;"
                >zoom_in</mat-icon
              >
            </div>
          } @else {
            <span class="text-slate-500 text-sm">Sin foto</span>
          }
        </div>
        @if (measurement().photo_url) {
          <div class="flex justify-end -mt-2">
            <button mat-stroked-button type="button" class="!border-slate-600 !text-slate-300 text-sm" (click)="openLightbox()">
              <mat-icon style="font-size:18px;width:18px;height:18px;">open_in_full</mat-icon>
              Ver foto en grande
            </button>
          </div>
        }

        <div class="text-xs text-slate-400 space-y-1 pb-1">
          <p><span class="text-slate-500">Medidor:</span> {{ measurement().meter_id }}</p>
          <p><span class="text-slate-500">Depto:</span> {{ measurement().apartment }} · {{ measurement().tower }}</p>
        </div>

        <mat-form-field appearance="outline" class="w-full dense-edit mt-1" [hideRequiredMarker]="true">
          <mat-label>Lectura (m³)</mat-label>
          <input
            matInput
            type="text"
            inputmode="text"
            spellcheck="false"
            autocomplete="off"
            class="font-mono text-base tracking-wide"
            [(ngModel)]="readingInput"
            (ngModelChange)="readingError.set(null)"
            [disabled]="loading()"
          />
          @if (readingError()) {
            <mat-error>{{ readingError() }}</mat-error>
          }
          @if (measurement().reading_layout === 'B') {
            <mat-hint class="!text-slate-500"
              >Tipo B: 5 enteros + 4 decimales, misma forma que A (ej. 00000,0646). Físicamente: 5 negros + 3 rojos + 1
              esfera.</mat-hint
            >
          } @else {
            <mat-hint class="!text-slate-500">Tipo A: 5 enteros + 4 dígitos tras la coma (ej. 00000,6407)</mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full dense-edit">
          <mat-label>Nota (opcional, historial)</mat-label>
          <input matInput [(ngModel)]="noteInput" [disabled]="loading()" />
        </mat-form-field>
      </div>

      <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-700 shrink-0">
        <button mat-stroked-button type="button" class="!border-slate-600" (click)="cancel()" [disabled]="loading()">
          Cancelar
        </button>
        <button
          mat-flat-button
          type="button"
          class="!bg-cyan-600 !text-white"
          (click)="save()"
          [disabled]="loading() || !isReadingInputValid()"
        >
          @if (loading()) {
            <span class="inline-flex items-center gap-2">
              <mat-icon class="animate-spin" style="font-size:18px;width:18px;height:18px;">progress_activity</mat-icon>
              Guardando…
            </span>
          } @else {
            Guardar
          }
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .dense-edit .mat-mdc-form-field-infix {
        padding-top: 8px !important;
        padding-bottom: 8px !important;
      }
    `,
  ],
})
export class MeasurementEditReadingDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MeasurementEditReadingDialogComponent, Measurement | undefined>);
  private readonly data = inject<MeasurementEditReadingDialogData>(MAT_DIALOG_DATA);
  private readonly measurementService = inject(MeasurementService);
  private readonly dialog = inject(MatDialog);

  readonly measurement = signal(this.data.measurement);
  readonly loading = signal(false);
  readonly readingError = signal<string | null>(null);
  /** Misma presentación que en listado/detalle: 00000,6407 */
  readingInput: string;
  noteInput = '';

  constructor() {
    const v = formatMeterReadingDisplay(this.data.measurement.reading_value, this.data.measurement.reading_layout);
    this.readingInput = v === '—' ? '' : v;
  }

  /**
   * Convierte "00000,6407" → número almacenado (concatenación de dígitos).
   * Exige exactamente una coma (separador entre bloques).
   */
  isReadingInputValid(): boolean {
    return this.parseFormattedReading(this.readingInput) !== null;
  }

  private parseFormattedReading(text: string): number | null {
    const intLen = 5;
    const fracLen = 4;
    const expectedTotal = intLen + fracLen;

    const t = text.trim();
    if (!t.includes(',')) return null;
    const parts = t.split(',');
    if (parts.length !== 2) return null;
    const intDigits = parts[0].replace(/\D/g, '');
    const fracDigits = parts[1].replace(/\D/g, '');
    if (!intDigits || !fracDigits) return null;
    if (intDigits.length + fracDigits.length !== expectedTotal) return null;
    if (!/^\d+$/.test(intDigits + fracDigits)) return null;
    // Backend espera Decimal m³ (DecimalField max_digits=12, decimal_places=4).
    // "15350,0000" → 15350.0  (no concatenar dígitos: eso supera max_whole_digits=8 y DRF rechaza con 400).
    const n = parseFloat(`${intDigits}.${fracDigits}`);
    return Number.isFinite(n) ? n : null;
  }

  openLightbox(): void {
    const m = this.measurement();
    if (!m.photo_url) return;
    this.dialog.open(ImageLightboxDialogComponent, {
      data: { photoUrl: m.photo_url, alt: `Medidor ${m.meter_id}` },
      panelClass: 'lightbox-dialog',
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100vw',
      height: '100vh',
    });
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  async save(): Promise<void> {
    const v = this.parseFormattedReading(this.readingInput);
    if (v === null) {
      this.readingError.set(
        'Formato: coma entre 5 enteros y 4 decimales, 9 dígitos en total (ej. 00000,6407 o 00000,0646 en tipo B).',
      );
      return;
    }
    this.readingError.set(null);
    this.loading.set(true);
    const updated = await this.measurementService.patchAdminFields(this.measurement().id, {
      reading_value: v,
      edit_note: this.noteInput?.trim() || undefined,
    });
    this.loading.set(false);
    if (updated) {
      this.dialogRef.close(updated);
    }
  }
}
