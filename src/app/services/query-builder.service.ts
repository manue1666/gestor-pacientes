import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Database {
  id: number;
  name: string;
  userId: number;
  description: string;
  sqlSchema: string;
  createdAt: string;
}

export interface GenerateQueryRequest {
  databaseId: number;
  description: string;
}

export interface QueryResponse {
  id: number;
  databaseId: number;
  userId: number;
  description: string;
  generatedSql: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class QueryBuilderService {
  private apiUrl = 'http://localhost:5112/api';

  constructor(private http: HttpClient) {}

  // Database endpoints
  getAllDatabases(): Observable<ApiResponse<Database[]>> {
    console.log('[Service] GET', `${this.apiUrl}/Database/all`);
    return this.http.get<any>(`${this.apiUrl}/Database/all`)
      .pipe(
        tap(response => {
          console.log('[Service] Raw Response:', response);
          if (Array.isArray(response)) {
            console.log('ℹ[Service] Response is array - will wrap it');
          }
        }),
        map(response => {
          // Si la respuesta es un array directo, envuélvelo en ApiResponse
          if (Array.isArray(response)) {
            console.log('[Service] Transforming array to ApiResponse');
            return { success: true, message: 'Success', data: response } as ApiResponse<Database[]>;
          }
          // Si ya es ApiResponse, retorno tal cual
          return response as ApiResponse<Database[]>;
        })
      );
  }

  getDatabase(databaseId: number): Observable<ApiResponse<Database>> {
    console.log('[Service] GET', `${this.apiUrl}/Database/${databaseId}`);
    return this.http.get<any>(`${this.apiUrl}/Database/${databaseId}`)
      .pipe(
        tap(response => {
          console.log('[Service] Raw Database Response:', response);
          if (response && !response.success && !response.data) {
            console.log('[Service] Response is direct Database object - will wrap it');
          }
        }),
        map(response => {
          // Si la respuesta es un objeto Database directo (sin success/message), envuélvelo en ApiResponse
          if (response && !response.success && response.id !== undefined) {
            
            return { success: true, message: 'Success', data: response } as ApiResponse<Database>;
          }
          // Si ya es ApiResponse, retorno tal cual
          return response as ApiResponse<Database>;
        })
      );
  }

  createDatabase(name: string, description: string, sqlSchema: string): Observable<ApiResponse<Database>> {
    return this.http.post<ApiResponse<Database>>(`${this.apiUrl}/Database/create`, {
      name,
      description,
      sqlSchema
    });
  }

  updateDatabase(databaseId: number, name?: string, description?: string, sqlSchema?: string): Observable<ApiResponse<Database>> {
    return this.http.put<ApiResponse<Database>>(`${this.apiUrl}/Database/${databaseId}`, {
      name,
      description,
      sqlSchema
    });
  }

  deleteDatabase(databaseId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/Database/${databaseId}`);
  }

  // Query endpoints
  generateQuery(request: GenerateQueryRequest): Observable<ApiResponse<QueryResponse>> {
    return this.http.post<ApiResponse<QueryResponse>>(`${this.apiUrl}/Query/generate`, request);
  }

  getAllQueries(databaseId: number, limit: number = 50, offset: number = 0, orderBy: string = 'createdAt'): Observable<ApiResponse<QueryResponse[]>> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString())
      .set('orderBy', orderBy);
    
    return this.http.get<any>(`${this.apiUrl}/Query/all/${databaseId}`, { params })
      .pipe(

        map(response => {
          // Si la respuesta es un array directo, envuélvelo en ApiResponse
          if (Array.isArray(response)) {
            return { success: true, message: 'Success', data: response } as ApiResponse<QueryResponse[]>;
          }
          return response as ApiResponse<QueryResponse[]>;
        })
      );
  }

  getQuery(queryId: number): Observable<ApiResponse<QueryResponse>> {
    return this.http.get<ApiResponse<QueryResponse>>(`${this.apiUrl}/Query/${queryId}`);
  }

  deleteQuery(queryId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/Query/${queryId}`);
  }
}
