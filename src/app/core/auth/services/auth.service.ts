import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly httpClient = inject(HttpClient);
  private readonly router = inject(Router);

  signIn(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/SignIn`, data).pipe(
      tap((res: any) => this.saveAuthData(res?.data))
    );
  }

  logout(): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/Logout`, {});
  }

  refreshToken(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/RefreshToken`, data).pipe(
      tap((res: any) => this.saveAuthData(res?.data))
    );
  }

  revokeToken(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/RevokeToken`, data);
  }

  revokeAllSessions(): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/RevokeAllSessions`, {});
  }

  forgotPassword(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/ForgotPassword`, data);
  }

  verifyResetCode(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/VerifyResetCode`, data);
  }

  resetPassword(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/ResetPassword`, data);
  }

  changePassword(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/ChangePassword`, data);
  }

  verifyCode(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/VerifyCode`, data);
  }

  resendCode(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/ResendCode`, data);
  }

  invite(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/Invite`, data);
  }

  verifyInvite(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/verify-invite`, data);
  }

  completeRegistration(data: object): Observable<any> {
    return this.httpClient.post(environment.baseUrl + `Auth/CompleteRegistration`, data);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('Token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getRefreshPayload(): object | null {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      return null;
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  getRevokePayload(): object | null {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    return { refreshToken };
  }

  saveAuthData(data: any): void {
    if (!data) return;

    const accessToken = data.accessToken ?? data.token ?? data.jwtToken;
    const refreshToken = data.refreshToken?.tokenString ?? data.refreshToken ?? data.refreshTokenString;
    const userEmail = data.refreshToken?.userName ?? data.userName ?? data.email;

    if (accessToken) {
      localStorage.setItem('Token', accessToken);
    }

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    if (userEmail) {
      localStorage.setItem('userEmail', userEmail);
    }
  }

  clearAuthData(): void {
    localStorage.removeItem('Token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
  }

  clearAuthDataAndRedirect(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }
}