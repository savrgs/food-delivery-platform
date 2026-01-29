import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserProfile {
  id: number;
  email: string;
  role: string;
  full_name: string | null;
  address: string | null;
  location_x: number;
  location_y: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private base = '/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Register a new customer account
   */
  register(data: {
    email: string;
    password: string;
    full_name?: string;
    address?: string;
    location_x?: number;
    location_y?: number;
  }): Observable<any> {
    return this.http.post(`${this.base}/register`, data);
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password }).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Logout and clear session
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  /**
   * Get current user profile from backend
   */
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>('/api/me');
  }

  /**
   * Update user profile
   */
  updateProfile(data: {
    full_name?: string;
    address?: string;
    location_x?: number;
    location_y?: number;
  }): Observable<UserProfile> {
    return this.http.patch<UserProfile>('/api/me', data);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get current user from BehaviorSubject
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Request password reset email
   */
  forgotPassword(email: string): Observable<{ message: string; resetToken?: string }> {
    return this.http.post<{ message: string; resetToken?: string }>(`${this.base}/forgot-password`, { email });
  }

  /**
   * Validate reset token
   */
  validateResetToken(token: string): Observable<{ valid: boolean }> {
    return this.http.post<{ valid: boolean }>(`${this.base}/validate-reset-token`, { token });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/reset-password`, { token, new_password: newPassword });
  }

  /**
   * Private: Save auth session to localStorage
   */
  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('token', authResult.token);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  /**
   * Private: Get user from localStorage on init
   */
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }
}
