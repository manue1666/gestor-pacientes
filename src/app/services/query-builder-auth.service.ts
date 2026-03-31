import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    userId?: number; // Para compatibilidad
    user?: {
      id: number;
      name: string;
      email: string;
      [key: string]: any;
    };
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class QueryBuilderAuthService {
  private apiUrl = 'https://querybuilderapi-production.up.railway.app/api/Auth';
  private tokenKey = 'qb_auth_token';
  private userIdKey = 'qb_user_id';
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkAuthenticationStatus();
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data?.token) {
            const userId = response.data.userId || response.data.user?.id;
            if (userId) {
              this.setToken(response.data.token, userId);
            }
          }
        }),
        catchError((error) => {
          return this.handleError(error);
        })
      );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data)
      .pipe(
        tap(response => {
          if (response.success && response.data?.token) {
            // La API retorna user.id, no userId
            const userId = response.data.userId || response.data.user?.id;
            if (userId) {
              this.setToken(response.data.token, userId);
            }
          }
        }),
        catchError((error) => {
          return this.handleError(error);
        })
      );
  }

  logout(): void {
    this.removeToken();
    this.isAuthenticatedSubject.next(false);
  }

  private setToken(token: string, userId: number): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userIdKey, userId.toString());
    this.isAuthenticatedSubject.next(true);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userIdKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUserId(): number | null {
    const userId = localStorage.getItem(this.userIdKey);
    return userId ? parseInt(userId, 10) : null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  private checkAuthenticationStatus(): void {
    this.isAuthenticatedSubject.next(this.hasToken());
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error en la autenticación';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente/red
      errorMessage = error.error.message;
    } else if (error.error?.message) {
      // Error de respuesta del servidor con message
      errorMessage = error.error.message;
    } else if (error.error?.errors) {
      // Error con estructura de errores
      const errors = error.error.errors;
      if (Array.isArray(errors)) {
        errorMessage = errors.join(', ');
      } else if (typeof errors === 'object') {
        errorMessage = Object.values(errors).join(', ');
      }
    } else if (error.status === 401) {
      errorMessage = 'Credenciales inválidas';
    } else if (error.status === 400) {
      errorMessage = 'Email no existe o los datos son inválidos';
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar con el servidor. Verifica que la API esté corriendo en http://localhost:5112';
    } else {
      errorMessage = error.error?.title || `Error ${error.status}: ${error.statusText}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
