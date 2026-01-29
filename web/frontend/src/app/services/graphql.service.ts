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

  constructor(private readonly http: HttpClient) {}

  execute<T>(query: string, variables?: Record<string, unknown>): Observable<GraphQlResponse<T>> {
    return this.http.post<GraphQlResponse<T>>(this.graphqlEndpoint, {
      query,
      variables
    });
  }

  private resolverEndpoint(): string {
    const configurado = (window as { EIA_GRAPHQL_ENDPOINT?: string })?.EIA_GRAPHQL_ENDPOINT;
    if (configurado) {
      return configurado;
    }

    const enDev = window.location.port === '4200';
    if (enDev) {
      return 'http://localhost:4000/graphql';
    }

    return '/graphql';
  }
}
