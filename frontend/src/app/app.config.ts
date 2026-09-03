// =============================================================================
//  frontend/src/app/app.config.ts
//  Configurazione globale dell'app: router + animazioni + HttpClient.
//  Centralizza i provider necessari ai 3 layout e ai servizi API.
// =============================================================================

import { ApplicationConfig } from '@angular/core';
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
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideAnimations(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor]))
  ]
};
