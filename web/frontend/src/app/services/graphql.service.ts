import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GraphQlResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    extensions?: Record<string, unknown>;
  }>;
}

@Injectable({ providedIn: 'root' })
export class GraphqlService {
  private readonly graphqlEndpoint = this.resolverEndpoint();

  constructor(private readonly http: HttpClient) { }

  execute<T>(query: string, variables?: Record<string, unknown>): Observable<GraphQlResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 1. Prioridad: JWT Real (RF-18)
    const jwtToken = localStorage.getItem('eia-jwt');
    if (jwtToken) {
      headers['Authorization'] = `Bearer ${jwtToken}`;
    } else {
      // 2. Segundo Nivel: Token de administrador
      const adminToken = localStorage.getItem('eia-admin-token');
      if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      } else {
        // 3. Fallback: Sesión de usuario básica (Legacy)
        const isUserAuth = localStorage.getItem('eia-user-session-active') === 'true';
        const userEmail = localStorage.getItem('eia-user-session-email');

        if (isUserAuth && userEmail) {
          // Generar token compatible con el middleware fallback (email:timestamp base64)
          const mockToken = btoa(`${userEmail}:${Date.now()}`);
          headers['Authorization'] = `Bearer ${mockToken}`;
        }
      }
    }

    return this.http.post<GraphQlResponse<T>>(this.graphqlEndpoint, {
      query,
      variables
    }, { headers });
  }

  private resolverEndpoint(): string {
    const configurado = (window as { EIA_GRAPHQL_ENDPOINT?: string })?.EIA_GRAPHQL_ENDPOINT;
    if (configurado) {
      return configurado;
    }

    const enDev = window.location.port === '4200';
    if (enDev) {
      const hostname = window.location.hostname;
      return `http://${hostname}:4000/graphql`;
    }

    return '/graphql';
  }
}
