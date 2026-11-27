// =============================================================================
//  frontend/src/app/services/auth.guard.ts
//  Guard funzionale: protegge le rotte /admin/* (tranne il login). Se l'utente
//  non è autenticato, redirige a /admin/login conservando la URL richiesta.
// =============================================================================

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Permesso } from '../shared/permessi';

/**
 * Consente l'accesso solo agli utenti autenticati. In assenza di sessione
 * valida, reindirizza alla pagina di login del backoffice.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.autenticato()) return true;

  return router.createUrlTree(['/admin/login'], {
    queryParams: { redirect: state.url }
  });
};

/**
 * Guard RBAC: consente l'accesso SOLO ai SuperUser. Usato per le sezioni
 * riservate del backoffice (Gestione Utenti, Newsletter, Impostazioni/Tema).
 * Se autenticato ma non SuperUser → torna alla dashboard; se non autenticato
 * → al login. La sicurezza vera resta comunque lato server ([Authorize]).
 */
export const superUserGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.autenticato())
    return router.createUrlTree(['/admin/login'], { queryParams: { redirect: state.url } });

  return auth.isSuperUser() ? true : router.createUrlTree(['/admin/dashboard']);
};

/**
 * Guard della matrice dei permessi: lascia passare chi ha almeno uno dei
 * permessi indicati (la Direzione li ha tutti). Senza permessi si torna al
 * pannello; senza sessione al login. La protezione vera resta sul server.
 */
export function permessoGuard(...permessi: Permesso[]): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.autenticato())
      return router.createUrlTree(['/admin/login'], { queryParams: { redirect: state.url } });
    return auth.puoUno(permessi) ? true : router.createUrlTree(['/admin/dashboard']);
  };
}

/**
 * Ingresso nel backoffice: serve almeno un permesso. Un Socio (nessun
 * permesso) viene portato alla sua area personale invece che in un
 * pannello vuoto.
 */
export const backofficeGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticato())
    return router.createUrlTree(['/admin/login'], { queryParams: { redirect: state.url } });
  return auth.haBackoffice() ? true : router.createUrlTree(['/area-personale']);
};
