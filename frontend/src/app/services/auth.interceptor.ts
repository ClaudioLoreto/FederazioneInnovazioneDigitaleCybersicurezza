// =============================================================================
//  frontend/src/app/services/auth.interceptor.ts
//  Interceptor funzionale che allega il JWT (Authorization: Bearer ...) a tutte
//  le chiamate dirette all'API FIDC. In caso di 401 forza il logout + redirect.
// =============================================================================

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Aggiunge il token di sessione alle richieste autenticate e gestisce il 401
 * (sessione scaduta) riportando l'utente alla pagina di login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token;

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Sessione scaduta: si forza il logout + ritorno al login SOLO se l'utente
      // si trova già DENTRO il backoffice (/admin). Le pagine PUBBLICHE (landing,
      // registrazione, ecc.) non devono MAI essere reindirizzate al login anche
      // se una chiamata API risponde 401: il portale resta pubblico.
      if (err.status === 401 && auth.autenticato() && router.url.startsWith('/admin')) {
        auth.logout();
        router.navigateByUrl('/admin/login', { state: { reason: 'session-expired' } });
      }
      return throwError(() => err);
    })
  );
};
