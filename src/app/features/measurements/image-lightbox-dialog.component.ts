import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-lightbox-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="relative flex items-center justify-center w-full h-full"
         style="min-height:80vh"
         (click)="dialogRef.close()">
      <button mat-icon-button
              class="!absolute !top-3 !right-3 !text-white !bg-black/60 hover:!bg-black/80 z-10"
              (click)="dialogRef.close(); $event.stopPropagation()"
              style="z-index:10">
        <mat-icon>close</mat-icon>
      </button>
      <img [src]="data.photoUrl"
           [alt]="data.alt || 'Imagen del medidor'"
           class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
           (click)="$event.stopPropagation()"
           (error)="onImageError($event)" />
      <div #errorPlaceholder class="hidden flex-col items-center justify-center text-slate-400 gap-3">
        <mat-icon style="font-size:64px;width:64px;height:64px;">hide_image</mat-icon>
        <span class="text-base">No se pudo cargar la imagen</span>
      </div>
    </div>
  `,
  styles: [`
    ::ng-deep .mat-mdc-dialog-container .mdc-dialog__surface {
      background: rgba(0,0,0,0.92) !important;
      box-shadow: none !important;
    }
  `],
})
export class ImageLightboxDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ImageLightboxDialogComponent>);
  readonly data: { photoUrl: string; alt?: string } = inject(MAT_DIALOG_DATA);

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const container = img.parentElement!;
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-slate-400 gap-3">
        <span class="material-icons" style="font-size:64px">hide_image</span>
        <span class="text-base">No se pudo cargar la imagen</span>
      </div>
    `;
  }
}
