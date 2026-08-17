import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), 
    provideClientHydration(withEventReplay()), 
    provideServiceWorker('./ngsw-worker.js', { // <-- 1. Adicionado o ponto e barra (./)
      enabled: !isDevMode(),
      registrationStrategy: 'registerImmediately' // <-- 2. Forçando o cache imediato!
    })
  ]
};