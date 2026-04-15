import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrganizationService, Organization } from '../../core/services/organization.service';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [
    FormsModule,
    SlicePipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-white">Organizaciones</h2>
          <p class="text-slate-400 text-sm mt-1">Administra los tenants del sistema</p>
        </div>
        <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold" (click)="showForm.set(true)">
          <mat-icon>add</mat-icon>
          Nueva Organización
        </button>
      </div>

      <!-- Create form -->
      @if (showForm()) {
        <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <h3 class="text-sm font-semibold text-slate-300">Nueva organización</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Nombre</mat-label>
              <input matInput [(ngModel)]="newName" placeholder="Ej: Edificios Central" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Slug (identificador único)</mat-label>
              <input matInput [(ngModel)]="newSlug" placeholder="Ej: edificios-central" />
            </mat-form-field>
          </div>
          <div class="flex gap-2 justify-end">
            <button mat-stroked-button class="!border-slate-600 !text-slate-400" (click)="cancelForm()">Cancelar</button>
            <button mat-flat-button class="!bg-cyan-500 !text-slate-900 !font-semibold"
                    [disabled]="!newName || !newSlug"
                    (click)="submit()">
              Crear
            </button>
          </div>
        </div>
      }

      <!-- List -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (org of orgService.orgs(); track org.id) {
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                  <mat-icon class="text-cyan-400" style="font-size:20px;width:20px;height:20px;">corporate_fare</mat-icon>
                </div>
                <div>
                  <p class="text-sm font-semibold text-white">{{ org.name }}</p>
                  <p class="text-xs text-slate-500 font-mono">{{ org.slug }}</p>
                </div>
              </div>
              <button mat-icon-button class="!w-8 !h-8 !text-slate-500 hover:!text-red-400"
                      matTooltip="Eliminar"
                      (click)="delete(org)">
                <mat-icon style="font-size:18px;width:18px;height:18px;">delete</mat-icon>
              </button>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2 text-center">
              <div class="bg-slate-700/50 rounded-lg py-2">
                <p class="text-lg font-bold text-white">{{ org.building_count }}</p>
                <p class="text-xs text-slate-400">Edificios</p>
              </div>
              <div class="bg-slate-700/50 rounded-lg py-2">
                <p class="text-lg font-bold text-white">{{ org.member_count }}</p>
                <p class="text-xs text-slate-400">Usuarios</p>
              </div>
            </div>
            <p class="text-xs text-slate-600 mt-3">Creada: {{ org.created_at | slice:0:10 }}</p>
          </div>
        } @empty {
          <div class="col-span-3 text-center text-slate-500 py-12">
            <mat-icon class="text-4xl mb-2" style="font-size:40px;width:40px;height:40px;">corporate_fare</mat-icon>
            <p class="text-sm">No hay organizaciones aún.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class OrganizationsComponent implements OnInit {
  readonly orgService = inject(OrganizationService);

  showForm = signal(false);
  newName = '';
  newSlug = '';

  ngOnInit(): void {
    this.orgService.loadAll();
  }

  cancelForm(): void {
    this.showForm.set(false);
    this.newName = '';
    this.newSlug = '';
  }

  async submit(): Promise<void> {
    if (!this.newName || !this.newSlug) return;
    await this.orgService.create(this.newName, this.newSlug);
    this.cancelForm();
  }

  delete(org: Organization): void {
    if (confirm(`¿Eliminar la organización "${org.name}"? Esta acción no se puede deshacer.`)) {
      this.orgService.delete(org.id);
    }
  }
}
