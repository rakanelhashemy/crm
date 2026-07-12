import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

let refreshRequest$: Observable<any> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (isRefreshRequest(req.url)) {
    return next(req);
  }

  const token = authService.getAccessToken();
  const authReq = token && !isPublicAuthRequest(req.url) ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      const status = err instanceof HttpErrorResponse ? err.status : (err as { status?: number })?.status;

      if (status !== 401 || isPublicAuthRequest(req.url)) {
        return throwError(() => err);
      }

      const refreshPayload = authService.getRefreshPayload();

      if (!refreshPayload) {
        authService.clearAuthDataAndRedirect();
        return throwError(() => err);
      }

      refreshRequest$ ??= authService.refreshToken(refreshPayload).pipe(
        finalize(() => {
          refreshRequest$ = null;
        }),
        shareReplay(1)
      );

      return refreshRequest$.pipe(
        switchMap(() => {
          const refreshedToken = authService.getAccessToken();

          if (!refreshedToken) {
            authService.clearAuthDataAndRedirect();
            return throwError(() => err);
          }

          return next(addToken(req, refreshedToken));
        }),
        catchError((refreshError) => {
          authService.clearAuthDataAndRedirect();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

function isRefreshRequest(url: string): boolean {
  return /Auth\/RefreshToken/i.test(url);
}

function isPublicAuthRequest(url: string): boolean {
  return /Auth\/(SignIn|ForgotPassword|ResetPassword|VerifyResetCode|VerifyCode|ResendCode|RefreshToken|RevokeToken|Logout)/i.test(url);
}