// =============================================================================
//  frontend/src/app/app.config.ts
//  Configurazione globale dell'app: router + animazioni + HttpClient.
//  Centralizza i provider necessari ai 3 layout e ai servizi API.
// =============================================================================

import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './services/auth.interceptor';

/**
 * Provider applicativi:
 *  - provideRouter: routing con scroll-to-top ad ogni cambio rotta;
 *  - provideAnimations: abilita @angular/animations usato dai layout;
 *  - provideHttpClient: chiamate REST al backend FIDC, con JWT interceptor.
 */
// Date e numeri in italiano ("12 dic 2026", "1.000") in tutta l'app.
registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideAnimations(),
    { provide: LOCALE_ID, useValue: 'it-IT' },
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
};
