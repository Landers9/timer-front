// src/environments/environment.ts

export const environment = {
  production: false,
  apiUrl: 'https://api.timemanager.modernetsoft.com/api/v1',
  apiTimeout: 30000,
  enableDebugLog: true,
  tokenRefreshBuffer: 300, // 5 minutes avant expiration
};
