import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-6">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
             [class]="iconBg">
          <mat-icon [class]="iconColor" style="font-size:22px;width:22px;height:22px;">{{ icon }}</mat-icon>
        </div>
        <div>
          <h3 class="text-base font-semibold text-white">{{ data.title }}</h3>
          <p class="text-sm text-slate-400 mt-1.5 leading-relaxed">{{ data.message }}</p>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-6">
        <button mat-button [mat-dialog-close]="false" class="!text-slate-400 cursor-pointer">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-flat-button [mat-dialog-close]="true"
                class="cursor-pointer !font-semibold"
                [class]="confirmBtnClass">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  get type() { return this.data.type || 'danger'; }

  get icon(): string {
    return this.type === 'danger' ? 'warning' : this.type === 'warning' ? 'help_outline' : 'info';
  }

  get iconBg(): string {
    const map = { danger: 'bg-red-500/15', warning: 'bg-amber-500/15', info: 'bg-blue-500/15' };
    return map[this.type];
  }

  get iconColor(): string {
    const map = { danger: 'text-red-400', warning: 'text-amber-400', info: 'text-blue-400' };
    return map[this.type];
  }

  get confirmBtnClass(): string {
    const map = {
      danger: '!bg-red-600 !text-white hover:!bg-red-500',
      warning: '!bg-amber-600 !text-white hover:!bg-amber-500',
      info: '!bg-cyan-500 !text-slate-900 hover:!bg-cyan-400',
    };
    return map[this.type];
  }
}
