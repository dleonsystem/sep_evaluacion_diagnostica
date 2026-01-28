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
  private readonly graphqlEndpoint = '/graphql';

  constructor(private readonly http: HttpClient) {}

  execute<T>(query: string, variables?: Record<string, unknown>): Observable<GraphQlResponse<T>> {
    return this.http.post<GraphQlResponse<T>>(this.graphqlEndpoint, {
      query,
      variables
    });
  }
}
