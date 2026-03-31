import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { GraphqlService } from './graphql.service';
import { EXPORT_TICKETS_CSV } from '../operations/query';

export interface Ticket {
  id: string;
  numeroTicket: string;
  asunto: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  correo?: string;
  nombreCompleto?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  evidencias?: Array<{ nombre: string; url: string; size?: number }>;
  respuestas?: Array<{ id: string; mensaje: string; fecha: string; autor: string; esInterno: boolean }>;
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
          nombreCompleto
          fechaCreacion
          fechaActualizacion
          evidencias {
            nombre
            url
            size
          }
          respuestas {
            id
            mensaje
            fecha
            autor
            esInterno
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

  getMyTickets(correo?: string): Observable<Ticket[]> {
    const query = `
      query GetMyTickets($correo: String) {
        getMyTickets(correo: $correo) {
          id
          numeroTicket
          asunto
          descripcion
          estado
          prioridad
          fechaCreacion
          fechaActualizacion
          evidencias {
            nombre
            url
            size
          }
          respuestas {
            id
            mensaje
            fecha
            autor
            esInterno
          }
        }
      }
    `;
    return this.graphqlService.execute<{ getMyTickets: Ticket[] }>(query, { correo }).pipe(
      map(res => {
        if (res.errors) throw new Error(res.errors[0].message);
        return res.data?.getMyTickets || [];
      })
    );
  }

  respondToTicket(ticketId: string, respuesta: string, cerrar: boolean, prioridad?: string): Observable<Ticket> {
    const mutation = `
      mutation RespondToTicket($ticketId: ID!, $respuesta: String!, $cerrar: Boolean!, $prioridad: String) {
        respondToTicket(ticketId: $ticketId, respuesta: $respuesta, cerrar: $cerrar, prioridad: $prioridad) {
          id
          numeroTicket
          asunto
          estado
          prioridad
          fechaActualizacion
          respuestas {
            id
            mensaje
            fecha
            autor
            esInterno
          }
        }
      }
    `;
    return this.graphqlService.execute<{ respondToTicket: Ticket }>(mutation, { ticketId, respuesta, cerrar, prioridad }).pipe(
      map(res => {
        if (res.errors) throw new Error(res.errors[0].message);
        if (!res.data?.respondToTicket) throw new Error('No se pudo responder al ticket');
        return res.data.respondToTicket;
      })
    );
  }

  createTicket(input: { motivo: string; descripcion: string; correo: string | null; evidencias: any[] }): Observable<Ticket> {
    const mutation = `
      mutation CreateTicket($input: CreateTicketInput!) {
        createTicket(input: $input) {
          id
          numeroTicket
          asunto
          descripcion
          estado
          prioridad
          fechaCreacion
          evidencias {
            nombre
            url
            size
          }
        }
      }
    `;
    return this.graphqlService.execute<{ createTicket: Ticket }>(mutation, { input }).pipe(
      map(res => {
        if (res.errors) throw new Error(res.errors[0].message);
        if (!res.data?.createTicket) throw new Error('No se pudo crear el ticket');
        return res.data.createTicket;
      })
    );
  }

  exportTicketsCSV(): Observable<{ success: boolean; fileName: string; contentBase64: string }> {
    return this.graphqlService.execute<{ exportTicketsCSV: any }>(EXPORT_TICKETS_CSV).pipe(
      map(res => {
        if (res.errors) throw new Error(res.errors[0].message);
        return res.data?.exportTicketsCSV;
      })
    );
  }

  downloadTicketEvidencia(url: string): Observable<{ success: boolean; fileName: string; contentBase64: string }> {
    const query = `
      query DownloadTicketEvidencia($url: String!) {
        downloadTicketEvidencia(url: $url) {
          success
          fileName
          contentBase64
        }
      }
    `;
    return this.graphqlService.execute<{ downloadTicketEvidencia: { success: boolean; fileName: string; contentBase64: string } }>(query, { url }).pipe(
      map(res => {
        if (res.errors) throw new Error(res.errors[0].message);
        if (!res.data?.downloadTicketEvidencia) throw new Error('No se pudo descargar la evidencia');
        return res.data.downloadTicketEvidencia;
      })
    );
  }

  getPublicIncidents(): Observable<Ticket[]> {
    const query = `
      query GetPublicIncidents {
        getPublicIncidents {
          id
          numeroTicket
          asunto
          descripcion
          estado
          prioridad
          correo
          nombreCompleto
          cct
          fechaCreacion
          fechaActualizacion
          respuestas {
            id
            mensaje
            fecha
            autor
            esInterno
          }
          evidencias {
            nombre
            url
            size
          }
        }
      }
    `;
    return this.graphqlService.execute<{ getPublicIncidents: Ticket[] }>(query).pipe(
      map(res => {
        if (res.errors) throw new Error(res.errors[0].message);
        return res.data?.getPublicIncidents || [];
      })
    );
  }

  createPublicIncident(input: { nombreCompleto: string; cct: string; email: string; descripcion: string }): Observable<Ticket> {
    const mutation = `
      mutation CreatePublicIncident($input: CreatePublicIncidentInput!) {
        createPublicIncident(input: $input) {
          id
          numeroTicket
          asunto
          descripcion
          estado
          prioridad
          fechaCreacion
        }
      }
    `;
    return this.graphqlService.execute<{ createPublicIncident: Ticket }>(mutation, { input }).pipe(
      map(res => {
        if (res.errors) throw new Error(res.errors[0].message);
        if (!res.data?.createPublicIncident) throw new Error('No se pudo crear la incidencia');
        return res.data.createPublicIncident;
      })
    );
  }
}
