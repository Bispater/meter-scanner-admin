import { Component, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { NotificationService, Toast } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none" style="max-width:380px;width:calc(100vw - 2.5rem)">
      @for (toast of notify.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3.5 shadow-2xl border-l-4 backdrop-blur-sm"
          [class]="toastClass(toast)"
          [class.toast-enter]="!toast.leaving"
          [class.toast-leave]="toast.leaving"
        >
          <!-- Icon -->
          <div class="shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                 [style.width.px]="18" [style.height.px]="18" [class]="iconColor(toast.type)">
              @switch (toast.type) {
                @case ('success') {
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
                }
                @case ('error') {
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd"/>
                }
                @case ('warning') {
                  <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                }
                @default {
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>
                }
              }
            </svg>
          </div>

          <!-- Message -->
          <p class="flex-1 text-sm font-medium leading-snug" [class]="textColor(toast.type)">
            {{ toast.message }}
          </p>

          <!-- Close -->
          <button
            class="shrink-0 opacity-50 hover:opacity-100 transition-opacity ml-1"
            [class]="textColor(toast.type)"
            (click)="notify.dismiss(toast.id)"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14">
              <path d="M2.22 2.22a.75.75 0 011.06 0L8 6.94l4.72-4.72a.75.75 0 111.06 1.06L9.06 8l4.72 4.72a.75.75 0 11-1.06 1.06L8 9.06l-4.72 4.72a.75.75 0 01-1.06-1.06L6.94 8 2.22 3.28a.75.75 0 010-1.06z"/>
            </svg>
          </button>

          <!-- Progress bar -->
          <div class="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
            <div
              class="h-full"
              [class]="progressColor(toast.type)"
              [ngStyle]="{ 'animation': 'progress-shrink ' + toast.duration + 'ms linear forwards' }"
            ></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`:host { position: fixed; top: 0; right: 0; z-index: 9999; pointer-events: none; }`],
})
export class ToastContainerComponent {
  readonly notify = inject(NotificationService);

  toastClass(toast: Toast): string {
    const base = 'relative overflow-hidden ';
    const map: Record<string, string> = {
      success: 'bg-emerald-950/90 border-emerald-500',
      error:   'bg-red-950/90 border-red-500',
      warning: 'bg-amber-950/90 border-amber-500',
      info:    'bg-blue-950/90 border-blue-500',
    };
    return base + (map[toast.type] ?? map['info']);
  }

  iconColor(type: string): string {
    const map: Record<string, string> = {
      success: 'text-emerald-400',
      error:   'text-red-400',
      warning: 'text-amber-400',
      info:    'text-blue-400',
    };
    return map[type] ?? map['info'];
  }

  textColor(type: string): string {
    const map: Record<string, string> = {
      success: 'text-emerald-100',
      error:   'text-red-100',
      warning: 'text-amber-100',
      info:    'text-blue-100',
    };
    return map[type] ?? map['info'];
  }

  progressColor(type: string): string {
    const map: Record<string, string> = {
      success: 'bg-emerald-500',
      error:   'bg-red-500',
      warning: 'bg-amber-500',
      info:    'bg-blue-500',
    };
    return map[type] ?? map['info'];
  }
}
