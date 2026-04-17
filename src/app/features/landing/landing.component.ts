import { Component, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  template: `
    <!-- ══ STICKY HEADER ══ -->
    <header
      class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      [class]="scrolled() ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg' : 'bg-transparent'"
    >
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <!-- Logo -->
        <a href="#" class="flex items-center gap-2.5 no-underline">
          <div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <mat-icon class="text-cyan-400" style="font-size:20px;width:20px;height:20px;">water_drop</mat-icon>
          </div>
          <span class="text-lg font-bold text-white tracking-tight">Metscan</span>
        </a>

        <!-- Desktop Nav -->
        <nav class="hidden md:flex items-center gap-8">
          <a href="#features" class="text-sm text-slate-400 hover:text-white transition-colors">Características</a>
          <a href="#how" class="text-sm text-slate-400 hover:text-white transition-colors">Cómo funciona</a>
          <a href="#subscription" class="text-sm text-slate-400 hover:text-white transition-colors">Tu cuenta</a>
          <a href="#pricing" class="text-sm text-slate-400 hover:text-white transition-colors">Precios</a>
          <a href="#contact" class="text-sm text-slate-400 hover:text-white transition-colors">Contacto</a>
        </nav>

        <!-- Header CTAs -->
        <div class="flex items-center gap-3">
          <a
            routerLink="/login"
            class="hidden md:inline-flex text-sm text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer no-underline"
          >
            Iniciar Sesión
          </a>
          <a
            href="#pricing"
            class="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold text-sm px-4 py-2 rounded-lg transition-colors no-underline"
          >
            Comenzar
          </a>
        </div>
      </div>
    </header>

    <!-- ══ HERO ══ -->
    <section class="relative min-h-screen flex items-center overflow-hidden bg-slate-900">
      <!-- Animated background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
        <div class="grid-lines"></div>
      </div>

      <div class="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 w-full">
        <div class="grid lg:grid-cols-2 gap-16 items-center">

          <!-- Left: Copy -->
          <div>
            <div class="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
              <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span class="text-cyan-400 text-xs font-medium tracking-wide">Gestión inteligente · IA integrada</span>
            </div>

            <h1 class="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Monitorea cada<br>
              <span class="gradient-text">gota de agua</span><br>
              en tiempo real
            </h1>

            <p class="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              Metscan digitaliza la lectura de medidores con tecnología QR,
              alertas automáticas y reportes detallados para edificios y
              torres residenciales.
            </p>

            <div class="flex flex-wrap gap-4">
              <a
                href="#pricing"
                class="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-6 py-3 rounded-xl transition-colors text-sm no-underline"
              >
                <mat-icon style="font-size:18px;width:18px;height:18px;">rocket_launch</mat-icon>
                Empezar ahora
              </a>
              <a
                routerLink="/login"
                [queryParams]="{demo: '1'}"
                class="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm border border-slate-700 no-underline"
              >
                <mat-icon style="font-size:18px;width:18px;height:18px;">science</mat-icon>
                Probar demo
              </a>
            </div>

            <!-- Trust stats -->
            <div class="flex items-center gap-6 mt-10 pt-8 border-t border-slate-800">
              <div class="text-center">
                <p class="text-2xl font-bold text-white">+2.500</p>
                <p class="text-xs text-slate-500 mt-0.5">Medidores activos</p>
              </div>
              <div class="w-px h-10 bg-slate-800"></div>
              <div class="text-center">
                <p class="text-2xl font-bold text-white">+120</p>
                <p class="text-xs text-slate-500 mt-0.5">Edificios gestionados</p>
              </div>
              <div class="w-px h-10 bg-slate-800"></div>
              <div class="text-center">
                <p class="text-2xl font-bold text-white">99.9%</p>
                <p class="text-xs text-slate-500 mt-0.5">Uptime garantizado</p>
              </div>
            </div>
          </div>

          <!-- Right: App mockup / video placeholder -->
          <div class="relative">
            <div class="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl shadow-cyan-500/5">
              <!-- Browser chrome -->
              <div class="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                <span class="w-3 h-3 rounded-full bg-red-500/70"></span>
                <span class="w-3 h-3 rounded-full bg-yellow-500/70"></span>
                <span class="w-3 h-3 rounded-full bg-emerald-500/70"></span>
                <span class="flex-1 bg-slate-700 rounded-md h-5 ml-3 flex items-center justify-center">
                  <span class="text-slate-500 text-xs">app.metscan.io/dashboard</span>
                </span>
              </div>

              <!-- Dashboard mockup -->
              <div class="bg-slate-900 flex" style="height:340px">
                <!-- Sidebar mockup -->
                <div class="w-12 bg-slate-800 border-r border-slate-700 flex flex-col gap-2 py-4 px-2 shrink-0">
                  @for (i of [1,2,3,4,5]; track i) {
                    <div class="h-6 rounded" [class]="i === 1 ? 'bg-cyan-500/30 border-l-2 border-cyan-400' : 'bg-slate-700/60'"></div>
                  }
                </div>
                <!-- Content mockup -->
                <div class="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                  <!-- Stat cards -->
                  <div class="grid grid-cols-3 gap-3">
                    <div class="bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <div class="w-6 h-3 bg-cyan-500/40 rounded mb-2"></div>
                      <div class="w-10 h-5 bg-white/20 rounded font-bold text-white text-sm flex items-center justify-center animate-count">247</div>
                    </div>
                    <div class="bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <div class="w-6 h-3 bg-amber-500/40 rounded mb-2"></div>
                      <div class="w-10 h-5 bg-white/20 rounded text-amber-400 text-sm flex items-center justify-center">12</div>
                    </div>
                    <div class="bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <div class="w-6 h-3 bg-emerald-500/40 rounded mb-2"></div>
                      <div class="w-10 h-5 bg-white/20 rounded text-emerald-400 text-sm flex items-center justify-center">98%</div>
                    </div>
                  </div>
                  <!-- Chart area -->
                  <div class="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-4 overflow-hidden">
                    <div class="w-24 h-3 bg-slate-600 rounded mb-4"></div>
                    <div class="flex items-end gap-2 h-24">
                      @for (h of chartHeights; track $index) {
                        <div
                          class="flex-1 rounded-t chart-bar"
                          [style.height.%]="h"
                        ></div>
                      }
                    </div>
                  </div>
                  <!-- Recent rows -->
                  <div class="bg-slate-800 rounded-xl border border-slate-700 divide-y divide-slate-700 overflow-hidden">
                    @for (i of [1,2]; track i) {
                      <div class="flex items-center gap-3 px-3 py-2">
                        <div class="w-6 h-6 rounded bg-slate-700"></div>
                        <div class="flex-1">
                          <div class="w-24 h-2.5 bg-slate-600 rounded mb-1"></div>
                          <div class="w-16 h-2 bg-slate-700 rounded"></div>
                        </div>
                        <div class="w-14 h-5 bg-emerald-500/20 rounded-full"></div>
                      </div>
                    }
                  </div>
                </div>
              </div>

              <!-- Play overlay -->
              <button
                class="absolute inset-0 flex items-center justify-center bg-slate-900/40 hover:bg-slate-900/25 transition-colors group"
                title="Ver demo en video"
              >
                <div class="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20 shadow-xl">
                  <mat-icon class="text-white" style="font-size:34px;width:34px;height:34px;">play_arrow</mat-icon>
                </div>
                <span class="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/60">Ver video demo</span>
              </button>
            </div>

            <!-- Floating notification badges -->
            <div class="absolute -top-5 -right-5 bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-2xl badge-float">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <mat-icon class="text-emerald-400" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white leading-tight">Lectura validada</p>
                  <p class="text-xs text-slate-500">Torre A · Depto 401</p>
                </div>
              </div>
            </div>
            <div class="absolute -bottom-5 -left-5 bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-2xl badge-float-rev">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
                  <mat-icon class="text-cyan-400" style="font-size:16px;width:16px;height:16px;">qr_code_scanner</mat-icon>
                </div>
                <div>
                  <p class="text-xs font-semibold text-white leading-tight">QR escaneado</p>
                  <p class="text-xs text-slate-500">47.3 m³ registrados</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Scroll cue -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span class="text-xs text-slate-500 tracking-widest uppercase">scroll</span>
        <div class="scroll-pill"></div>
      </div>
    </section>

    <!-- ══ SUBSCRIPTION / ACCOUNT (fuera del login) ══ -->
    <section id="subscription" class="relative bg-slate-950 border-y border-slate-800/80">
      <div class="max-w-7xl mx-auto px-6 py-16 lg:py-20">
        <div class="text-center mb-12 max-w-2xl mx-auto">
          <p class="text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-3">Contratación</p>
          <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">De la suscripción a tu cuenta</h2>
          <p class="text-slate-400 text-base leading-relaxed">
            Contratas un plan (o nos escribes para uno a medida). Activamos tu <strong class="text-slate-300">organización</strong> en Metscan
            y te enviamos el acceso al <strong class="text-slate-300">correo que indiques</strong>: ahí recibirás la invitación o las credenciales del panel de administración.
            No necesitas crear nada a mano antes de iniciar sesión: el alta va ligada a tu compra o acuerdo comercial.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          @for (s of subscriptionSteps; track s.title) {
            <div class="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 text-center hover:border-cyan-500/25 transition-colors">
              <div class="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" [class]="s.iconBg">
                <mat-icon [class]="s.iconColor" style="font-size:26px;width:26px;height:26px;">{{ s.icon }}</mat-icon>
              </div>
              <p class="text-xs font-bold text-cyan-500/90 uppercase tracking-wide mb-2">Paso {{ s.step }}</p>
              <h3 class="text-lg font-semibold text-white mb-2">{{ s.title }}</h3>
              <p class="text-slate-400 text-sm leading-relaxed">{{ s.body }}</p>
            </div>
          }
        </div>

        <div class="max-w-xl mx-auto bg-slate-800/40 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center">
          <mat-icon class="text-cyan-400 mb-3" style="font-size:36px;width:36px;height:36px;">mark_email_read</mat-icon>
          <p class="text-white font-semibold mb-2">¿Ya pagaste o quieres activar tu cuenta?</p>
          <p class="text-slate-400 text-sm mb-6">
            Escríbenos con el correo donde quieres recibir el acceso y el nombre de tu administración o edificio. Respondemos con los siguientes pasos (o integración con pago cuando esté conectado).
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:hola@metscan.io?subject=Suscripción%20Metscan%20-%20alta%20de%20cuenta&amp;body=Correo%20para%20el%20acceso%3A%0ANombre%20organización%20%2F%20edificio%3A%0APlan%20de%20interés%3A%0A"
              class="inline-flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-5 py-3 rounded-xl text-sm transition-colors no-underline"
            >
              <mat-icon style="font-size:18px;width:18px;height:18px;">mail</mat-icon>
              Solicitar acceso por correo
            </a>
            <a
              href="#pricing"
              class="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-5 py-3 rounded-xl text-sm border border-slate-600 transition-colors no-underline"
            >
              <mat-icon style="font-size:18px;width:18px;height:18px;">payments</mat-icon>
              Ver planes
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ LOGO STRIP ══ -->
    <div class="bg-slate-950 border-y border-slate-800 py-8">
      <div class="max-w-5xl mx-auto px-6">
        <p class="text-center text-xs text-slate-600 uppercase tracking-widest mb-6">Confiado por administradoras líderes</p>
        <div class="flex flex-wrap items-center justify-center gap-10 opacity-30 grayscale">
          @for (brand of brands; track brand) {
            <span class="text-slate-400 font-bold text-sm tracking-widest">{{ brand }}</span>
          }
        </div>
      </div>
    </div>

    <!-- ══ FEATURES ══ -->
    <section id="features" class="py-24 bg-slate-900">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-3">Características</p>
          <h2 class="text-4xl font-bold text-white mb-4">Todo lo que necesitas<br>para gestionar el agua</h2>
          <p class="text-slate-400 text-lg max-w-2xl mx-auto">Una plataforma completa para digitalizar, monitorear y optimizar el consumo de agua.</p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (f of features; track f.title) {
            <div class="group bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-600 hover:bg-slate-800 transition-all duration-300 hover:-translate-y-1">
              <div class="w-12 h-12 rounded-xl mb-5 flex items-center justify-center" [class]="f.iconBg">
                <mat-icon [class]="f.iconColor" style="font-size:24px;width:24px;height:24px;">{{ f.icon }}</mat-icon>
              </div>
              <h3 class="text-lg font-semibold text-white mb-2">{{ f.title }}</h3>
              <p class="text-slate-400 text-sm leading-relaxed">{{ f.description }}</p>
            </div>
          }
        </div>

        <!-- ── AI highlight card ── -->
        <div class="mt-6 bg-gradient-to-r from-violet-500/10 via-purple-500/[0.07] to-blue-500/10 border border-violet-500/25 rounded-2xl p-7 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div class="shrink-0 w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
            <mat-icon class="text-violet-400" style="font-size:28px;width:28px;height:28px;">psychology</mat-icon>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1.5">
              <h3 class="text-lg font-bold text-white">Extracción de lecturas con Inteligencia Artificial</h3>
              <span class="bg-violet-500/20 text-violet-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full tracking-wide uppercase">IA</span>
            </div>
            <p class="text-slate-400 text-sm leading-relaxed max-w-3xl">El operario toma una foto del medidor con su celular y nuestra IA extrae el valor de la lectura automáticamente. Sin tipeo manual, sin errores humanos. Los datos se validan y registran al instante en el panel.</p>
          </div>
          <div class="shrink-0 flex flex-col items-center gap-1 bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-3 text-center">
            <span class="text-3xl font-extrabold text-violet-400">99%</span>
            <span class="text-xs text-slate-500">precisión de lectura</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ HOW IT WORKS ══ -->
    <section id="how" class="py-24 bg-slate-950">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-3">Proceso</p>
          <h2 class="text-4xl font-bold text-white mb-4">Tan simple como escanear</h2>
          <p class="text-slate-400 text-lg max-w-xl mx-auto">Implementa Metscan en tu edificio en minutos.</p>
        </div>

        <!-- Steps -->
        <div class="relative grid md:grid-cols-3 gap-10">
          <!-- Connector line (desktop) -->
          <div class="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" style="top:40px;left:20%;right:20%"></div>

          @for (step of steps; track step.number) {
            <div class="text-center">
              <div class="relative inline-flex w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 items-center justify-center mb-5 mx-auto">
                <mat-icon class="text-cyan-400" style="font-size:28px;width:28px;height:28px;">{{ step.icon }}</mat-icon>
                <span class="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-cyan-500 text-slate-900 text-xs font-bold flex items-center justify-center">{{ step.number }}</span>
              </div>
              <h3 class="text-lg font-semibold text-white mb-3">{{ step.title }}</h3>
              <p class="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{{ step.description }}</p>
            </div>
          }
        </div>

        <!-- Space for image / animation -->
        <div class="mt-16 rounded-2xl border border-dashed border-slate-700 bg-slate-800/30 flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
          <mat-icon class="text-slate-600" style="font-size:48px;width:48px;height:48px;">videocam</mat-icon>
          <p class="text-slate-500 text-sm">Espacio para video / animación de producto</p>
          <p class="text-slate-600 text-xs">Resolución recomendada: 1280 × 720 · MP4 o WebM</p>
        </div>
      </div>
    </section>

    <!-- ══ PRICING ══ -->
    <section id="pricing" class="py-24 bg-slate-900">
      <div class="max-w-7xl mx-auto px-6">
        <div class="text-center mb-16">
          <p class="text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-3">Planes</p>
          <h2 class="text-4xl font-bold text-white mb-4">Precio transparente, sin sorpresas</h2>
          <p class="text-slate-400 text-lg max-w-xl mx-auto">Elige el plan que se adapta a tu edificio. Cambia o cancela cuando quieras.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 items-start">
          @for (plan of plans; track plan.name) {
            <div
              class="relative rounded-2xl border overflow-hidden transition-all duration-300"
              [class]="plan.highlighted
                ? 'bg-gradient-to-b from-cyan-500/[0.07] to-slate-800 border-cyan-500/40 shadow-2xl shadow-cyan-500/10 md:scale-105 md:-mt-4 md:mb-4'
                : 'bg-slate-800 border-slate-700 hover:border-slate-600'"
            >
              <!-- Top accent bar -->
              @if (plan.highlighted) {
                <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400"></div>
                <div class="absolute top-4 right-4">
                  <span class="bg-cyan-500 text-slate-900 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Más popular</span>
                </div>
              }

              <div class="p-8">
                <!-- Plan header -->
                <div class="mb-6">
                  <div class="w-10 h-10 rounded-lg mb-4 flex items-center justify-center" [class]="plan.iconBg">
                    <mat-icon [class]="plan.iconColor" style="font-size:20px;width:20px;height:20px;">{{ plan.icon }}</mat-icon>
                  </div>
                  <h3 class="text-xl font-bold text-white">{{ plan.name }}</h3>
                  <p class="text-slate-400 text-sm mt-1">{{ plan.description }}</p>
                </div>

                <!-- Price -->
                <div class="mb-8">
                  <div class="flex items-end gap-1">
                    <span class="text-4xl font-extrabold" [class]="plan.highlighted ? 'text-cyan-400' : 'text-white'">&#36;{{ plan.price }}</span>
                    <span class="text-slate-500 text-sm mb-1.5">/mes</span>
                  </div>
                  @if (plan.annualNote) {
                    <p class="text-emerald-400 text-xs mt-1.5">{{ plan.annualNote }}</p>
                  }
                </div>

                <!-- Features list -->
                <ul class="space-y-3 mb-8">
                  @for (feat of plan.features; track feat) {
                    <li class="flex items-start gap-3 text-sm">
                      <mat-icon class="text-cyan-400 shrink-0 mt-0.5" style="font-size:16px;width:16px;height:16px;">check_circle</mat-icon>
                      <span class="text-slate-300">{{ feat }}</span>
                    </li>
                  }
                </ul>

                <!-- CTA -->
                <button
                  class="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200"
                  [class]="plan.highlighted
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900'
                    : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'"
                >
                  {{ plan.cta }}
                </button>
              </div>
            </div>
          }
        </div>

        <p class="text-center text-slate-500 text-sm mt-10">
          ¿Necesitas un plan personalizado?
          <a href="mailto:hola@metscan.io" class="text-cyan-400 hover:underline ml-1">Contáctanos →</a>
        </p>
      </div>
    </section>

    <!-- ══ CTA BANNER ══ -->
    <section class="py-20 bg-slate-950">
      <div class="max-w-4xl mx-auto px-6">
        <div class="relative rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-12 lg:p-16 overflow-hidden text-center">
          <!-- Orbs -->
          <div class="absolute w-72 h-72 rounded-full bg-cyan-500 blur-3xl opacity-[0.06] -top-20 -left-10 pointer-events-none"></div>
          <div class="absolute w-48 h-48 rounded-full bg-blue-500 blur-3xl opacity-[0.08] -bottom-10 right-10 pointer-events-none"></div>
          <!-- Content -->
          <div class="relative z-10">
            <mat-icon class="text-cyan-400 mb-4" style="font-size:44px;width:44px;height:44px;">water_drop</mat-icon>
            <h2 class="text-4xl font-extrabold text-white mb-4">Empieza a ahorrar agua hoy</h2>
            <p class="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
              Únete a cientos de edificios que ya gestionan su consumo de forma inteligente.
            </p>
            <div class="flex flex-wrap justify-center gap-4">
              <a
                href="#pricing"
                class="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-7 py-3.5 rounded-xl transition-colors no-underline"
              >
                <mat-icon style="font-size:18px;width:18px;height:18px;">rocket_launch</mat-icon>
                Comenzar prueba gratuita
              </a>
              <a
                routerLink="/login"
                class="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium px-7 py-3.5 rounded-xl transition-colors border border-slate-600 no-underline"
              >
                <mat-icon style="font-size:18px;width:18px;height:18px;">login</mat-icon>
                Acceder al panel
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══ FOOTER ══ -->
    <footer id="contact" class="bg-slate-950 border-t border-slate-800 py-12">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <mat-icon class="text-cyan-400" style="font-size:18px;width:18px;height:18px;">water_drop</mat-icon>
            </div>
            <span class="text-base font-bold text-white">Metscan</span>
          </div>
          <nav class="flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500">
            <a href="#features" class="hover:text-slate-300 transition-colors">Características</a>
            <a href="#subscription" class="hover:text-slate-300 transition-colors">Tu cuenta</a>
            <a href="#pricing" class="hover:text-slate-300 transition-colors">Precios</a>
            <a href="mailto:hola@metscan.io" class="hover:text-slate-300 transition-colors">hola&#64;metscan.io</a>
            <a routerLink="/login" class="hover:text-slate-300 transition-colors">Admin</a>
          </nav>
          <p class="text-xs text-slate-700">© 2025 Metscan. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; }

    /* ── Gradient text ── */
    .gradient-text {
      background: linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Background grid ── */
    .grid-lines {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px);
      background-size: 64px 64px;
    }

    /* ── Animated orbs ── */
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.11;
    }
    .orb-1 {
      width: 640px; height: 640px;
      background: radial-gradient(circle, #22d3ee, transparent 70%);
      top: -220px; left: -120px;
      animation: orb-drift-1 9s ease-in-out infinite;
    }
    .orb-2 {
      width: 480px; height: 480px;
      background: radial-gradient(circle, #3b82f6, transparent 70%);
      bottom: -100px; right: -80px;
      animation: orb-drift-2 11s ease-in-out infinite;
    }
    .orb-3 {
      width: 320px; height: 320px;
      background: radial-gradient(circle, #8b5cf6, transparent 70%);
      top: 55%; left: 45%;
      animation: orb-drift-3 13s ease-in-out infinite;
    }

    @keyframes orb-drift-1 {
      0%, 100% { transform: translate(0,0) scale(1); }
      40%       { transform: translate(30px,-30px) scale(1.07); }
      70%       { transform: translate(-20px,20px) scale(0.94); }
    }
    @keyframes orb-drift-2 {
      0%, 100% { transform: translate(0,0) scale(1); }
      50%       { transform: translate(-40px,-30px) scale(1.1); }
    }
    @keyframes orb-drift-3 {
      0%, 100% { transform: translate(0,0); }
      50%       { transform: translate(40px,25px); }
    }

    /* ── Floating badges ── */
    .badge-float     { animation: badge-bob 4s ease-in-out infinite; }
    .badge-float-rev { animation: badge-bob 4s ease-in-out infinite reverse; animation-delay: -2s; }
    @keyframes badge-bob {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(-8px); }
    }

    /* ── Chart bars ── */
    .chart-bar {
      background: linear-gradient(to top, #22d3ee, #0e7490);
      border-radius: 3px 3px 0 0;
      opacity: 0.75;
      animation: bar-grow 1.2s ease-out both;
    }
    @keyframes bar-grow {
      from { transform: scaleY(0); transform-origin: bottom; }
      to   { transform: scaleY(1); transform-origin: bottom; }
    }

    /* ── Scroll pill indicator ── */
    .scroll-pill {
      width: 22px; height: 36px;
      border: 2px solid rgba(148,163,184,0.25);
      border-radius: 11px;
      position: relative;
    }
    .scroll-pill::after {
      content: '';
      position: absolute;
      top: 5px; left: 50%;
      transform: translateX(-50%);
      width: 4px; height: 7px;
      background: rgba(148,163,184,0.4);
      border-radius: 2px;
      animation: scroll-dot 2s ease-in-out infinite;
    }
    @keyframes scroll-dot {
      0%   { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(14px); }
    }
  `],
})
export class LandingComponent {
  scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  /** Pasos del flujo comercial → cuenta (contenido marketing; el alta real la hace el equipo o futuro checkout). */
  readonly subscriptionSteps = [
    {
      step: '1',
      icon: 'shopping_cart',
      title: 'Eliges plan o cotización',
      body: 'Comparas precios aquí o pides un plan Empresarial. El cobro puede ser mensual, anual o acuerdo directo.',
      iconBg: 'bg-cyan-500/15',
      iconColor: 'text-cyan-400',
    },
    {
      step: '2',
      icon: 'hub',
      title: 'Creamos tu organización',
      body: 'En el backend queda tu tenant (organización), lista para edificios, usuarios y lecturas. No tienes que “registrarte” solo en la web pública.',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
    },
    {
      step: '3',
      icon: 'forward_to_inbox',
      title: 'Acceso en tu correo',
      body: 'Recibes en el email indicado la invitación o usuario administrador para entrar al panel. Desde ahí gestionas todo.',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
    },
  ];

  readonly chartHeights = [40, 65, 55, 80, 45, 70, 90, 60];

  readonly brands = ['ACME RESI', 'METROPOLIS', 'EDIFICIOS SA', 'URBA GROUP', 'CONDO PLUS'];

  readonly features = [
    {
      icon: 'qr_code_scanner',
      title: 'Lectura por QR',
      description: 'Los operarios escanean los medidores con su smartphone usando códigos QR únicos asignados a cada unidad.',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
    },
    {
      icon: 'notifications_active',
      title: 'Alertas Automáticas',
      description: 'Detección de consumos anómalos con notificaciones instantáneas a los administradores del edificio.',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
    },
    {
      icon: 'analytics',
      title: 'Reportes Detallados',
      description: 'Genera reportes por edificio, torre o departamento con historial completo de consumo en PDF.',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-400',
    },
    {
      icon: 'apartment',
      title: 'Multi-edificio',
      description: 'Gestiona múltiples edificios y torres desde un único panel centralizado y unificado.',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
    },
    {
      icon: 'verified_user',
      title: 'Validación de Datos',
      description: 'Sistema de revisión y aprobación de lecturas para garantizar la precisión absoluta de los datos.',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-400',
    },
    {
      icon: 'history',
      title: 'Historial Completo',
      description: 'Accede al historial de lecturas, ciclos y consumos por período con filtros avanzados.',
      iconBg: 'bg-rose-500/10',
      iconColor: 'text-rose-400',
    },
  ];

  readonly steps = [
    {
      number: 1,
      icon: 'qr_code',
      title: 'Instala los QRs',
      description: 'Genera e imprime códigos QR únicos para cada medidor de agua en tus instalaciones.',
    },
    {
      number: 2,
      icon: 'phone_android',
      title: 'Escanea con la app',
      description: 'El operario usa la app móvil de Metscan para escanear y registrar cada lectura.',
    },
    {
      number: 3,
      icon: 'dashboard',
      title: 'Gestiona en el panel',
      description: 'Los administradores revisan, validan y analizan todas las lecturas desde el panel web.',
    },
  ];

  readonly plans = [
    {
      name: 'Básico',
      description: 'Ideal para edificios pequeños',
      price: '49',
      annualNote: null,
      icon: 'home',
      iconBg: 'bg-slate-700',
      iconColor: 'text-slate-300',
      highlighted: false,
      cta: 'Comenzar gratis',
      features: [
        'Hasta 50 medidores',
        '1 edificio / torre',
        'Reportes mensuales en PDF',
        'App móvil incluida',
        'Soporte por email',
        '30 días de historial',
      ],
    },
    {
      name: 'Profesional',
      description: 'Para conjuntos residenciales',
      price: '149',
      annualNote: '↓ Ahorra 20% con pago anual',
      icon: 'business',
      iconBg: 'bg-cyan-500/15',
      iconColor: 'text-cyan-400',
      highlighted: true,
      cta: 'Empezar ahora',
      features: [
        'Hasta 300 medidores',
        'Hasta 5 edificios',
        'Panel de administración completo',
        'Monitoreo en tiempo real',
        'Alertas automáticas de anomalías',
        'API REST incluida',
        'Soporte prioritario 24/7',
        '12 meses de historial',
      ],
    },
    {
      name: 'Empresarial',
      description: 'Para grandes administradoras',
      price: '399',
      annualNote: null,
      icon: 'corporate_fare',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      highlighted: false,
      cta: 'Contactar ventas',
      features: [
        'Medidores ilimitados',
        'Edificios ilimitados',
        'Todo lo del plan Profesional',
        'Integraciones personalizadas',
        'SSO / LDAP',
        'SLA 99.9% garantizado',
        'Gerente de cuenta dedicado',
        'Facturación personalizada',
      ],
    },
  ];
}
