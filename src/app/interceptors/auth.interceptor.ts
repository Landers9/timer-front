// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor fonctionnel pour Angular 18+
 * Ajoute automatiquement le token JWT à toutes les requêtes HTTP
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Ne pas ajouter le token pour les requêtes d'authentification
  if (isAuthRequest(req.url)) {
    return next(req);
  }

  // Récupérer le token
  const token = authService.getToken();

  // Cloner la requête et ajouter le token si disponible
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Envoyer la requête et gérer les erreurs
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Gérer les erreurs 401 (Non autorisé)
      if (error.status === 401) {
        return authService.refreshAccessToken().pipe(
          switchMap((response: any) => {
            // Refaire la requête avec le nouveau token
            const newAuthReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${response.access}`,
              },
            });
            return next(newAuthReq);
          }),
          catchError((refreshError) => {
            // Si le refresh échoue, déconnecter l'utilisateur
            authService.logout().subscribe();
            router.navigate(['/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};

/**
 * Vérifie si l'URL correspond à un endpoint d'authentification
 * Ces endpoints ne doivent PAS avoir de token Authorization
 */
function isAuthRequest(url: string): boolean {
  const authEndpoints = [
    '/auth/login/',
    '/auth/login/verify-code/',
    '/auth/login/resend-code/',
    '/auth/logout/',
    '/auth/token/refresh/',
    '/users/reset-password/',
    '/users/reset-password/verify-code/',
    '/users/confirm-password-reset/',
  ];

  return authEndpoints.some((endpoint) => url.includes(endpoint));
}
