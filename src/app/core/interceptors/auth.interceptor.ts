import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = sessionStorage.getItem('hydroscan_access_token');

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        sessionStorage.removeItem('hydroscan_access_token');
        sessionStorage.removeItem('hydroscan_refresh_token');
        sessionStorage.removeItem('hydroscan_user');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
