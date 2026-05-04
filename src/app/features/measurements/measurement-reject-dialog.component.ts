import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RejectionCategory } from '../../core/models/measurement.model';

export interface MeasurementRejectDialogData {
  meterId: string;
  apartmentNumber: string;
}

export interface MeasurementRejectResult {
  category: RejectionCategory;
  reason: string;
}

@Component({
  selector: 'app-measurement-reject-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="bg-slate-800 text-slate-200 min-w-[440px] max-w-[520px]">
      <div class="px-5 pt-5 pb-3 flex items-center gap-3 border-b border-slate-700">
        <div class="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
          <mat-icon class="text-red-400">close</mat-icon>
        </div>
        <div class="min-w-0">
          <h2 class="text-lg font-bold text-white m-0">Rechazar medición</h2>
          <p class="text-xs text-slate-500 m-0 truncate">
            Depto <strong class="text-slate-300">{{ data.apartmentNumber }}</strong>
            · Medidor <strong class="text-slate-300">{{ data.meterId }}</strong>
          </p>
        </div>
      </div>

      <div class="px-5 py-4 space-y-4">
        <div>
          <p class="text-xs font-semibold text-slate-300 mb-2">Motivo del rechazo</p>
          <div class="grid grid-cols-1 gap-2">
            @for (opt of options; track opt.value) {
              <button type="button"
                      class="flex items-start gap-3 text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer"
                      [class]="category === opt.value
                          ? 'bg-red-500/10 border-red-500/60 text-white'
                          : 'bg-slate-700/40 border-slate-600 text-slate-300 hover:border-slate-500'"
                      (click)="category = opt.value">
                <mat-icon style="font-size:18px;width:18px;height:18px;margin-top:2px"
                          [class]="category === opt.value ? 'text-red-400' : 'text-slate-500'">
                  {{ opt.icon }}
                </mat-icon>
                <div class="min-w-0">
                  <p class="text-sm font-semibold m-0">{{ opt.label }}</p>
                  <p class="text-[11px] text-slate-500 m-0">{{ opt.description }}</p>
                </div>
              </button>
            }
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-300 mb-1 block" for="reject-reason">
            Detalle adicional <span class="text-slate-500 font-normal">(opcional, recomendado)</span>
          </label>
          <textarea id="reject-reason"
                    [(ngModel)]="reason"
                    maxlength="1000"
                    rows="3"
                    placeholder="Ej: la foto está borrosa y no se distinguen los dígitos."
                    class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500 resize-none"></textarea>
          <p class="text-[10px] text-slate-500 mt-1">
            {{ reason.length }}/1000 — el operador verá este mensaje en la app.
          </p>
        </div>

        <div class="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-start gap-2">
          <mat-icon class="text-amber-400 shrink-0" style="font-size:16px;width:16px;height:16px;margin-top:1px">info</mat-icon>
          <p class="text-[11px] text-slate-300 m-0 leading-relaxed">
            Al rechazar, se notifica al operador que debe volver a medir este departamento.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-2 px-5 pb-5 pt-2">
        <button mat-button mat-dialog-close class="!text-slate-400 cursor-pointer">Cancelar</button>
        <button mat-flat-button
                [disabled]="!category"
                [class]="category ? '!bg-red-600 !text-white cursor-pointer' : '!bg-slate-700 !text-slate-500'"
                (click)="confirm()">
          <mat-icon>close</mat-icon> Rechazar y notificar
        </button>
      </div>
    </div>
  `,
})
export class MeasurementRejectDialogComponent {
  readonly data = inject<MeasurementRejectDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MeasurementRejectDialogComponent, MeasurementRejectResult>);

  readonly options: { value: RejectionCategory; label: string; description: string; icon: string }[] = [
    {
      value: 'photo',
      label: 'Foto',
      description: 'La foto del medidor no es clara o no se ve bien.',
      icon: 'photo_camera',
    },
    {
      value: 'reading',
      label: 'Medición manual incorrecta',
      description: 'La lectura ingresada no corresponde a lo que muestra la foto.',
      icon: 'pin',
    },
  ];

  category: RejectionCategory | null = null;
  reason = '';

  confirm(): void {
    if (!this.category) return;
    this.dialogRef.close({ category: this.category, reason: this.reason.trim() });
  }
}
