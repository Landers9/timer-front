// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, icons } from 'lucide-angular';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...appConfig.providers!,
    importProvidersFrom(LucideAngularModule.pick(icons)),
  ],
});
