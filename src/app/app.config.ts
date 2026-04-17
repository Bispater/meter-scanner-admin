import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { demoInterceptor } from './core/interceptors/demo.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([demoInterceptor, authInterceptor])),
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'es-CL' },
    { provide: LOCALE_ID, useValue: 'es-CL' },
  ],
};
