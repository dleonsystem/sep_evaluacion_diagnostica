import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphqlService } from './graphql.service';

export interface Ticket {
    id: string;
    numeroTicket: string;
    asunto: string;
    descripcion: string;
    estado: string;
    prioridad: string;
    correo?: string;
    fechaCreacion: string;
    fechaActualizacion: string;
    evidencias?: Array<{ nombre: string; url: string; size?: number }>;
}

@Injectable({ providedIn: 'root' })
export class TicketsService {
    constructor(private readonly graphqlService: GraphqlService) { }

    getAllTickets(): Observable<Ticket[]> {
        const query = `
      query GetAllTickets {
        getAllTickets {
          id
          numeroTicket
          asunto
          descripcion
          estado
          prioridad
          correo
          fechaCreacion
          fechaActualizacion
          evidencias {
            nombre
            url
            size
          }
        }
      }
    `;
        return this.graphqlService.execute<{ getAllTickets: Ticket[] }>(query).pipe(
            map(res => {
                if (res.errors) throw new Error(res.errors[0].message);
                return res.data?.getAllTickets || [];
            })
        );
    }

    respondToTicket(ticketId: string, respuesta: string, cerrar: boolean): Observable<Ticket> {
        const mutation = `
      mutation RespondToTicket($ticketId: ID!, $respuesta: String!, $cerrar: Boolean!) {
        respondToTicket(ticketId: $ticketId, respuesta: $respuesta, cerrar: $cerrar) {
          id
          numeroTicket
          asunto
          estado
          fechaActualizacion
        }
      }
    `;
        return this.graphqlService.execute<{ respondToTicket: Ticket }>(mutation, { ticketId, respuesta, cerrar }).pipe(
            map(res => {
                if (res.errors) throw new Error(res.errors[0].message);
                if (!res.data?.respondToTicket) throw new Error('No se pudo responder al ticket');
                return res.data.respondToTicket;
            })
        );
    }
}
