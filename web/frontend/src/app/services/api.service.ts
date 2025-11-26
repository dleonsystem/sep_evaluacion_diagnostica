import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';
import { getArchivosPorEvento, getConfiguracion, getEnlacesDeInteres, getEstados, getEventos, getMe, getMunicipiosPorEstado, getUsuario, listaEsperaPorEvento, registrosPorUsuario, usuarioEnListaEspera } from '../operations/query';

import {
  Usuario,
  LoginResponse,
  UsuarioInput,
  RegistroEventoInput,
  CancelacionResponse,
  EstadosResponse,
  MunicipiosResponse,
  ActualizarUsuarioInput,
  ActualizarUsuarioResponse,
  ArchivosPorEventoResponse,
  ListaEsperaResponse
} from '../interfaces/models';

import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { Estado, Municipio, UsuarioResponse } from '../interfaces/registro.interface';
import { actualizarUsuario, cancelarRegistro, crearRegistro, crearUsuario, login, registrarEnListaEspera } from '../operations/mutation';

declare const grecaptcha: any;




// Interfaz para la respuesta de eventos desde GraphQL
// Interfaz para la respuesta de eventos desde GraphQL - ACTUALIZADA
export interface EventoResponse {
  status: boolean;
  message: string;
  eventos: {
    id: string;
    nombre: string;
    descripcion: string;
    fecha: string;
    hora: string;
    capacidadMaxima: number;
    cupoDisponible: number;
    lugar: string;
    tipo: string;
    estado: string;
    urlImagen: string;
    destacado?: boolean;
    modalidad: string;
    sectorId?: string;
    // ✅ CAMPO EXISTENTE: Campo para pregunta personalizada de subsectores
    preguntaSubsector?: string;
    // ✅ NUEVO: Información del programa
    programa?: {
      Descripcion: string;
      Nombre: string;
    } | null;
    // ✅ NUEVO: Actividades del programa
    actividadesPrograma?: {
      CargoPonente: string;
      Descripcion: string;
      EventoId: string;
      FechaHoraFin: string;
      FechaHoraInicio: string;
      Institucion: string;
      NombreActividad: string;
      NombrePonente: string;
      Oid: string;
      TemaActividad: string;
      UrlArchivo: string;
    }[] | null;
    // ✅ CAMPOS EXISTENTES: Campos para sectores y subsectores
    sectores?: {
      id: string;
      nombre: string;
      descripcion: string;
    }[];
    subsectores?: {
      id: string;
      nombre: string;
      descripcion: string;
    }[];
  }[];
}

export interface UsuarioGQLResponse {
  status: boolean;
  message: string;
  usuarios: {
    id: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correoElectronico: string;
    telefono: string;
    curp: string;
    fechaNacimiento: string;
    sexo: string | number;
    entidad: string; // Agregado nuevo campo
    rol: string;
  }[];
}

export interface RegistroEventoResponse {
  status: boolean;
  message: string;
  registroIds: string[];
}

export interface ListaEsperaPorEventoResponse {
  status: boolean;
  message: string;
  listaEspera: {
    id: string;
    usuarioId: string;
    eventoId: string;
  }[];
}

export interface ListaEsperaRegistroResponse {
  status: boolean;
  message: string;
  listaEsperaIds: string[];
}

export interface ConfiguracionResponse {
  status: boolean;
  message: string;
  configuracion: {
    llave: string;
    valor: string;
  }[];
}

export interface EnlacesDeInteresResponse {
  status: boolean;
  message: string;
  enlaces: {
    id: string;
    nombre: string;
    descripcion: string;
    url: string;
    nombreEnlace: string;
    urlEnlace2: string;
    nombreEnlace2: string;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // Token JWT para autenticación
  private authToken: string | null = null;

  constructor(private apollo: Apollo, private authService: AuthService, private router: Router) {
    // Verificar si hay un token en localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
      this.authToken = token;
    }
  }

  private syncAuthToken(): string | null {
    if (this.authToken) {
      return this.authToken;
    }

    const storedToken = localStorage.getItem('authToken') || this.authService.getToken();
    if (storedToken) {
      this.authToken = storedToken;
      return storedToken;
    }

    return null;
  }

   private getAuthHeaders() {
    const token = this.syncAuthToken();
    if (!token) {
      this.router.navigate(['/login']);
      throw new Error('No autorizado. Redirigiendo a login.');
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Método para manejar errores de GraphQL
  private handleGraphQLError(error: any, operationName: string = 'operación'): void {
    console.error(`Error en ${operationName}:`, error);

    // Crear un mensaje de error más descriptivo
    let errorMessage = 'Error de conexión con el servidor';

    // Verificar si es un error de red/conexión
    if (error.networkError) {
      errorMessage = 'Error de conexión con el servidor. Por favor, verifica tu conexión a internet.';
      console.error(errorMessage);
    }
    // Verificar si son errores específicos de GraphQL
    else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      // Extraer mensajes de error específicos de GraphQL
      const messages = error.graphQLErrors.map((err: any) => err.message).join(', ');
      errorMessage = `Error en el servicio: ${messages}`;

      console.error(errorMessage);
    }
  }

  getConfiguracion(): Observable<ConfiguracionResponse> {
    return this.apollo.query({
      query: getConfiguracion,
      fetchPolicy: 'no-cache',
    }).pipe(
      map((result: any) => result.data.getConfiguracion),
      catchError(error => {
        this.handleGraphQLError(error, 'getConfiguracion');
        return throwError(() => error);
      })
    );
  }

  listaEsperaPorEvento(eventoId: string): Observable<ListaEsperaPorEventoResponse> {
    return this.apollo.query({
      query: listaEsperaPorEvento,
      variables: { eventoId },
      fetchPolicy: 'no-cache',
      context: {
        headers: this.getAuthHeaders(),
      },
    }).pipe(
      map((result: any) => result.data.listaEsperaPorEvento),
      catchError(error => {
        this.handleGraphQLError(error, 'listaEsperaPorEvento');
        return throwError(() => error);
      })
    );
  }

  /* getLogin(username: string, password: string): any {
  return this.apollo.mutate({
    mutation: login,
    variables: {
      input: {
        correoElectronico: username,
        password: password
      }
    },
    fetchPolicy: 'no-cache',
  }).pipe(
    catchError(error => {
      this.handleGraphQLError(error, 'login');
      return throwError(() => error);
    })
  );
} */

  // Método para registrar un usuario
   registrarUsuario(userData: UsuarioInput, recaptchaToken: string): Observable<UsuarioResponse> {
    return this.apollo.mutate({
      mutation: crearUsuario,
      variables: {
        input: userData
      },
    }).pipe(
      map((result: any) => {
        return result.data.crearUsuario;
      }),
      catchError(error => {
        console.error('Error al registrar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  getMe(token: string): Observable<any> {
    return new Observable(observer => {
      // Ejecutar la mutación de getMe
      this.apollo.query({
        query: getMe,
        context: {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        }
      }).pipe(
        map((result: any) => result.data.me)
      ).subscribe({
        next: (response: any) => {

          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Error en getMe:', error);
          observer.error(error);
          observer.complete();
        }
      });

    });
  }

  getRegistrosPorUsuario(usuarioId: string): Observable<any[]> {
    console.log('🔍 Obteniendo registros para usuario:', usuarioId);

    const token = this.syncAuthToken();
    if (!token) {
      console.error('❌ No hay token disponible para consultar registros');
      return of([]);
    }

    return this.apollo.query({
      query: registrosPorUsuario,
      variables: {
        usuarioId: usuarioId
      },
      context: {
        headers: {
          'Authorization': 'Bearer ' + token  // ✅ USAR EL TOKEN ENCONTRADO
        }
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    }).pipe(
      map((result: any) => {
        console.log('📦 Respuesta completa de GraphQL:', result);

        // Verificar si hay errores pero aún hay datos
        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ GraphQL errors encontrados:', result.errors);
        }

        // Procesar datos incluso si hay errores
        if (result.data &&
            result.data.registrosPorUsuario) {

          const response = result.data.registrosPorUsuario;

          // ✅ VERIFICAR SI LA RESPUESTA ES EXITOSA
          if (response.status === false) {
            console.error('❌ Error del servidor:', response.message);

            // Si el error es de autorización, intentar reautenticar
            if (response.message.includes('autorización') ||
                response.message.includes('token') ||
                response.message.includes('No autorizado')) {
              console.error('❌ Error de autorización detectado');
              // Opcional: redirigir a login o intentar refrescar token
            }

            return [];
          }

          if (response.status &&
              response.registros &&
              Array.isArray(response.registros)) {

            const registros = response.registros;
            console.log('✅ Registros encontrados:', registros.length);

            registros.forEach((registro: any, index: number) => {
              console.log(`📋 Registro ${index + 1}:`, {
                id: registro.id,
                eventoId: registro.evento?.id,
                eventoNombre: registro.evento?.nombre,
                cancelado: registro.cancelado,
                fechaRegistro: registro.fechaRegistro
              });
            });

            return registros;
          } else {
            console.log('❌ Estructura de respuesta inesperada:', result.data);
            return [];
          }
        } else {
          console.log('❌ No hay datos en la respuesta');
          return [];
        }
      }),
      catchError((error: any) => {
        console.error('❌ Error de red en getRegistrosPorUsuario:', error);
        return of([]);
      }),
      tap((registros: any[]) => {
        console.log('🎯 Resultado final:', registros.length, 'registros');
      })
    );
  }

  // Método para iniciar sesión con reCAPTCHA
  login(variables: { email: string; password: string; }, tokenReCaptcha: string): Observable<LoginResponse> {

    return new Observable(observer => {
      // Ejecutar la mutación de login
      this.apollo.mutate({
        mutation: login,
        variables: {
          input: {
            correoElectronico: variables.email,
            password: variables.password
          }
        },
        context: {
          headers: {
            'x-recaptcha-token': tokenReCaptcha
          }
        }
      }).pipe(
        map((result: any) => result.data.login)
      ).subscribe({
        next: (response: LoginResponse) => {
          // Log para depuración
          /* console.log('Respuesta completa de login:', response); */

          if (response.status && response.token) {
            // Guardar el token
            this.authToken = response.token;
            localStorage.setItem('authToken', response.token);

            // Guardar el usuario en localStorage si es necesario
            if (response.usuario) {
              // Log para depuración
              /* console.log('Usuario original de la API:', response.usuario); */

              // IMPORTANTE: Usar el ID exactamente como viene de la API, sin conversión
              // El ID debe mantenerse como string (UUID)
              const usuario: Usuario = {
                id: response.usuario.id, // Guardar el ID como string (UUID completo)
                nombre: response.usuario.nombre,
                apellidoPaterno: response.usuario.apellidoPaterno,
                apellidoMaterno: response.usuario.apellidoMaterno,
                curp: response.usuario.curp,
                fechaNacimiento: response.usuario.fechaNacimiento,
                sexo: response.usuario.sexo.toString(),
                entidad: '', // Agregado nuevo campo con valor por defecto
                correoElectronico: response.usuario.correoElectronico,
                apellidos: `${response.usuario.apellidoPaterno} ${response.usuario.apellidoMaterno}`,
                email: response.usuario.correoElectronico,
                telefono: response.usuario.telefono || '',
                institucion: '', // Campo que no viene en la respuesta GraphQL
                cargo: response.usuario.rol,
                eventos: [] // Inicialmente sin eventos
              };

              /* console.log('Usuario guardado en localStorage:', usuario); */
              /* localStorage.setItem('usuarioActual', JSON.stringify(usuario)); */
            }
          }
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          console.error('Error en login:', error);
          observer.error(error);
          observer.complete();
        }
      });

    });
  }

  // Método para obtener eventos
  // Método para obtener eventos - ACTUALIZADO con logging de nuevos campos
getEventos(): Observable<EventoResponse> {
  return this.apollo.query({
    query: getEventos
  }).pipe(
    map((result: any) => {
      // ✅ Log para verificar los nuevos campos
      /* console.log('🎯 Resultado getEventos con programa y actividades:', result); */

      if (result.data?.eventos?.eventos) {
        result.data.eventos.eventos.forEach((evento: any, index: number) => {
          /* console.log(`📅 Evento ${index + 1}:`, {
            id: evento.id,
            nombre: evento.nombre,
            programa: evento.programa,
            actividadesPrograma: evento.actividadesPrograma?.length || 0
          }); */

          // Log detallado del programa si existe
          if (evento.programa) {
            /* console.log(`   📋 Programa:`, {
              nombre: evento.programa.Nombre,
              descripcion: evento.programa.Descripcion?.substring(0, 50) + '...'
            }); */
          }

          // Log de actividades si existen
          if (evento.actividadesPrograma && evento.actividadesPrograma.length > 0) {
            /* console.log(`   🎯 Actividades (${evento.actividadesPrograma.length}):`); */
            evento.actividadesPrograma.forEach((actividad: any, actIndex: number) => {
              /* console.log(`      ${actIndex + 1}. ${actividad.NombreActividad} - ${actividad.NombrePonente}`); */
            });
          }
        });
      }

      return result.data.eventos;
    }),
    catchError(error => {
      console.error('Error al obtener eventos:', error);
      return throwError(() => error);
    })
  );
}

  // Método para obtener usuario por ID
  getUsuario(usuarioId: string): Observable<any> {
    // Asegurar que el ID es string
    const userId = String(usuarioId);

    const token = this.syncAuthToken();

    return this.apollo.query({
      query: getUsuario,
      variables: {
        usuarioId: userId
      },
      context: token
        ? {
            headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
          }
        : undefined
    }).pipe(
      map((result: any) => {
        /* console.log('Resultado getUsuario:', result); */

        return result.data.usuario;
      }),
      catchError(error => {
        console.error('Error al obtener usuario:', error);
        return throwError(() => error);
      })
    );
  }

// ✅ MÉTODO crearRegistroEvento CORREGIDO - Permitir estados
  // api.service.ts - Método crearRegistroEvento CORREGIDO

  crearRegistroEvento(registroData: RegistroEventoInput, recaptchaToken: string): Observable<RegistroEventoResponse> {
    console.log('🚀 === CREANDO REGISTRO ===');

    const token = this.syncAuthToken();
    if (!token) {
      console.error('❌ No hay token de autenticación disponible');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const datosFinales = { ...registroData };

    Object.keys(datosFinales).forEach((key) => {
      const valor = (datosFinales as any)[key];

      if (key === 'subsectores' || key === 'ubicacionesEmpresa') {
        console.log(`✅ Manteniendo array válido ${key}:`, valor);
        return;
      }

      if (valor === null || valor === undefined || valor === '') {
        delete (datosFinales as any)[key];
      } else if (typeof valor === 'object' && !Array.isArray(valor)) {
        delete (datosFinales as any)[key];
      } else if (typeof valor === 'boolean' || typeof valor === 'number') {
        // mantener
      } else if (Array.isArray(valor)) {
        console.warn(`❌ Eliminando ${key} porque es un array no permitido:`, valor);
        delete (datosFinales as any)[key];
      } else {
        (datosFinales as any)[key] = String(valor);
      }
    });

    console.log('🎯 DATOS LIMPIOS PARA REGISTRO:', datosFinales);

    return this.apollo.mutate({
      mutation: crearRegistro,
      variables: {
        input: datosFinales
      },
      context: {
        headers: new HttpHeaders()
          .set('Authorization', `Bearer ${token}`)
          .set('x-recaptcha-token', recaptchaToken)
      },
      errorPolicy: 'all'
    }).pipe(
      map((result: any) => {
        console.log('✅ Resultado de crearRegistro:', result.data);
        console.log('⚠️ Errores GraphQL (si existen):', result.errors);

        if (result.data?.crearRegistro) {
          const response = result.data.crearRegistro;
          const ids = Array.isArray(response.registros)
            ? response.registros.map((r: any) => typeof r === 'string' ? r : r.id)
            : [];
          return {
            status: response.status,
            message: response.message,
            registroIds: ids,
          } as RegistroEventoResponse;
        }
        throw new Error('Respuesta inesperada del servidor');
      }),
      catchError(error => {
        console.error('❌ Error al crear registro:', error);

        if (error.message?.includes('btrim') || error.message?.includes('text[]')) {
          console.error('🚨 ERROR: Algún campo sigue siendo un arreglo no esperado');
          console.error('📦 Datos enviados:', datosFinales);
        }

        return throwError(() => error);
      })
    );
  }

// ✅ MÉTODO registrarEnListaEspera ACTUALIZADO con misma corrección
  registrarEnListaEspera(registroData: RegistroEventoInput, recaptchaToken: string): Observable<ListaEsperaRegistroResponse> {
    console.log('🚀 === INICIANDO REGISTRO EN LISTA DE ESPERA ===');

    const token = this.syncAuthToken();
    if (!token) {
      console.error('❌ No hay token de autenticación disponible para lista de espera');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const datosFinales = { ...registroData };

    Object.keys(datosFinales).forEach((key) => {
      const valor = (datosFinales as any)[key];

      if (key === 'subsectores' || key === 'ubicacionesEmpresa') {
        console.log(`✅ Manteniendo array válido ${key}:`, valor);
        return;
      }

      if (valor === null || valor === undefined || valor === '') {
        delete (datosFinales as any)[key];
      } else if (typeof valor === 'object' && !Array.isArray(valor)) {
        delete (datosFinales as any)[key];
      } else if (typeof valor === 'boolean' || typeof valor === 'number') {
        // mantener
      } else if (Array.isArray(valor)) {
        console.warn(`❌ Eliminando ${key} porque es un array no permitido:`, valor);
        delete (datosFinales as any)[key];
      } else {
        (datosFinales as any)[key] = String(valor);
      }
    });

    console.log('🎯 DATOS FINALES PARA LISTA DE ESPERA:', datosFinales);

    return this.apollo.mutate({
      mutation: registrarEnListaEspera,
      variables: {
        input: datosFinales
      },
      context: {
        headers: new HttpHeaders()
          .set('Authorization', `Bearer ${token}`)
          .set('x-recaptcha-token', recaptchaToken)
      },
      errorPolicy: 'all'
    }).pipe(
      map((result: any) => {
        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ Errores GraphQL detectados:');
          result.errors.forEach((error: any, index: number) => {
            console.warn(`   Error ${index + 1}:`, error.message);
          });
        }

        if (result.data?.registrarEnListaEspera) {
          const response = result.data.registrarEnListaEspera;
          const ids = Array.isArray(response.listaEspera)
            ? response.listaEspera.map((r: any) => r.id || r.usuario?.id || 'unknown')
            : [];
          return {
            status: response.status,
            message: response.message,
            listaEsperaIds: ids,
          } as ListaEsperaRegistroResponse;
        }
        console.error('❌ No se encontró data.registrarEnListaEspera');
        throw new Error('Respuesta inesperada del servidor');
      }),
      catchError(error => {
        console.error('💥 Error en registrarEnListaEspera:', error);
        return of({
          status: false,
          message: error.message || 'Error al registrar en lista de espera',
          listaEsperaIds: []
        } as ListaEsperaRegistroResponse);
      })
    );
  }

// Método para obtener usuario actual desde localStorage
// Método para obtener usuario actual desde localStorage
  getUsuarioActual(): Usuario | null {
    const usuarioJson = localStorage.getItem('usuarioActual');
    if (usuarioJson) {
      try {
        const usuario = JSON.parse(usuarioJson);

        // Verificar que el ID sea string - si es número, convertirlo
        if (usuario && typeof usuario.id === 'number') {
          console.warn('⚠️ El ID del usuario está almacenado como número. Se convertirá a string');
          usuario.id = String(usuario.id);
        }

        // Verificar que eventos sea un array de strings
        if (usuario && Array.isArray(usuario.eventos)) {
          usuario.eventos = usuario.eventos.map((id: string | number) =>
            typeof id === 'number' ? String(id) : id
          );
        }

        // Asegurarse de que exista la propiedad entidad
        if (usuario && !usuario.entidad) {
          usuario.entidad = '';
        }

        return usuario;
      } catch (error) {
        console.error('Error al parsear usuario de localStorage:', error);
        return null;
      }
    }
    return null;
  }

  // Método para logout
  logout(): void {
    // Limpiar tokens de autenticación
    this.authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('usuarioActual');
  }


  // ✅ MÉTODO cancelarRegistroEvento CORREGIDO - Agregar sincronización de token
  cancelarRegistroEvento(registroId: string, motivo: string, recaptchaToken: string): Observable<CancelacionResponse> {
    console.log('🚀 === INICIANDO CANCELACIÓN DE REGISTRO ===');
    console.log('📊 Registro ID:', registroId);
    console.log('📝 Motivo:', motivo);

    const token = this.syncAuthToken();
    if (!token) {
      console.error('❌ No hay token de autenticación disponible para cancelar');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.apollo.mutate({
      mutation: cancelarRegistro,
      variables: {
        registroId: registroId,
        motivo: motivo
      },
      context: {
        headers: new HttpHeaders()
          .set('Authorization', `Bearer ${token}`)
          .set('x-recaptcha-token', recaptchaToken)
      },
      errorPolicy: 'all'
    }).pipe(
      map((result: any) => {
        console.log('✅ Respuesta de cancelación recibida:', result);

        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ GraphQL errors encontrados en cancelación:', result.errors);
        }

        if (result.data?.cancelarRegistro) {
          const response = result.data.cancelarRegistro;
          console.log('✅ Cancelación procesada exitosamente');
          return response;
        } else {
          console.error('❌ Respuesta GraphQL inesperada en cancelación:', result);
          throw new Error('Formato de respuesta inesperado');
        }
      }),
      catchError(error => {
        console.error('❌ Error en la mutación GraphQL de cancelación:', error);

        // ✅ Manejo especial para errores que aún pueden ser exitosos
        if (error.data && error.data.cancelarRegistro && error.data.cancelarRegistro.status === true) {
          console.log('✅ Cancelación exitosa a pesar del error GraphQL');
          return of(error.data.cancelarRegistro);
        }

        return throwError(() => error);
      })
    );
  }



  // Método para obtener todos los estados
  getEstados(): Observable<{ status: boolean, message: string, estados: Estado[] }> {
    return this.apollo.query({
      query: getEstados
    }).pipe(
      map((result: any) => {
        return result.data.estados;
      }),
      catchError(error => {
        console.error('Error al obtener estados:', error);
        return throwError(() => error);
      })
    );
  }

  // Método para obtener municipios por estado
  getMunicipiosPorEstado(estadoId: number): Observable<{ status: boolean, message: string, municipios: Municipio[] }> {
    return this.apollo.query({
      query: getMunicipiosPorEstado,
      variables: {
        estadoId
      }
    }).pipe(
      map((result: any) => {
        return result.data.municipiosPorEstado;
      }),
      catchError(error => {
        console.error('Error al obtener municipios:', error);
        return throwError(() => error);
      })
    );
  }

/**
 * Método para actualizar un usuario con validación de reCAPTCHA - CORRECCIÓN FINAL
 */
  actualizarUsuario(userData: ActualizarUsuarioInput, recaptchaToken: string): Observable<ActualizarUsuarioResponse> {
    const token = this.syncAuthToken();

    if (!token) {
      console.error('❌ No hay token de autenticación disponible para actualización');
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.apollo.mutate({
      mutation: actualizarUsuario,
      variables: {
        input: userData
      },
      context: {
        headers: new HttpHeaders()
          .set('Authorization', `Bearer ${token}`)
          .set('x-recaptcha-token', recaptchaToken)
      }
    }).pipe(
      map((result: any) => {
        console.log('Resultado de actualización:', result);

        if (result.data?.actualizarUsuario) {
          const response = result.data.actualizarUsuario;

          if (response.status && response.usuario) {
            const usuarioActualizado: Usuario = {
              id: response.usuario.id,
              nombre: response.usuario.nombre,
              apellidoPaterno: response.usuario.apellidoPaterno,
              apellidoMaterno: response.usuario.apellidoMaterno,
              curp: response.usuario.curp,
              fechaNacimiento: response.usuario.fechaNacimiento,
              sexo: JSON.parse(localStorage.getItem('usuarioActual') || '{}').sexo || '0',
              entidad: '',
              correoElectronico: response.usuario.correoElectronico,
              apellidos: `${response.usuario.apellidoPaterno} ${response.usuario.apellidoMaterno}`,
              email: response.usuario.correoElectronico,
              telefono: response.usuario.telefono || '',
              institucion: '',
              cargo: response.usuario.rol,
              eventos: JSON.parse(localStorage.getItem('usuarioActual') || '{}').eventos || []
            };

            console.log('Usuario actualizado para localStorage:', usuarioActualizado);
            localStorage.setItem('usuarioActual', JSON.stringify(usuarioActualizado));
          }

          return response;
        } else {
          console.error('Respuesta GraphQL inesperada:', result);
          throw new Error('Formato de respuesta inesperado');
        }
      }),
      catchError(error => {
        console.error('Error al actualizar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Método para obtener archivos de un evento específico
   */
  getArchivosPorEvento(eventoId: string): Observable<ArchivosPorEventoResponse> {
    /* console.log(`🔍 Obteniendo archivos para evento: ${eventoId}`); */

    return this.apollo.query({
      query: getArchivosPorEvento,
      variables: {
        eventoId: String(eventoId)
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    }).pipe(
      map((result: any) => {
        /* console.log('📦 Respuesta completa de archivos:', result); */

        if (result.errors && result.errors.length > 0) {
          console.warn('⚠️ GraphQL errors encontrados:', result.errors);
        }

        if (result.data && result.data.archivosPorEvento) {
          const response = result.data.archivosPorEvento;
          /* console.log(`✅ Archivos encontrados: ${response.archivos?.length || 0}`); */

          // Log de cada archivo
          if (response.archivos && Array.isArray(response.archivos)) {
            response.archivos.forEach((archivo: any, index: number) => {
              /* console.log(`📄 Archivo ${index + 1}:`, {
                id: archivo.id,
                nombre: archivo.nombreArchivo,
                tipo: archivo.tipoArchivo,
                fecha: archivo.fechaCarga
              }); */
            });
          }

          return response;
        } else {
          /* console.log('❌ Estructura de respuesta inesperada:', result.data); */
          return {
            status: false,
            message: 'Respuesta inesperada del servidor',
            archivos: []
          };
        }
      }),
      catchError((error: any) => {
        console.error('❌ Error al obtener archivos:', error);
        return of({
          status: false,
          message: error.message || 'Error al obtener archivos',
          archivos: []
        });
      }),
      tap((response: ArchivosPorEventoResponse) => {
        /* console.log('🎯 Resultado final de archivos:', response.archivos.length, 'archivos'); */
      })
    );
  }


   /**
   * Método para obtener los enlaces de interés
   */
  getEnlacesDeInteres(): Observable<EnlacesDeInteresResponse> {
    return this.apollo.query({
      query: getEnlacesDeInteres,
      fetchPolicy: 'network-only'
    }).pipe(
      map((result: any) => {
        /* console.log('Resultado getEnlacesDeInteres:', result); */
        return result.data.enlacesDeInteres;
      }),
      catchError(error => {
        console.error('Error al obtener enlaces de interés:', error);
        return throwError(() => error);
      })
    );
  }



// ✅ Método para verificar si un usuario está en lista de espera
  verificarUsuarioEnListaEspera(usuarioId: string, eventoId: string): Observable<ListaEsperaResponse> {
    console.log('🔍 Verificando si usuario está en lista de espera:', { usuarioId, eventoId });

    const token = this.syncAuthToken();
    if (!token) {
      console.error('❌ No hay token disponible para verificar lista de espera');
      return of({
        status: false,
        message: 'Usuario no autenticado',
        enListaEspera: false,
        listaEspera: null,
        error: 'No hay token de autenticación'
      });
    }

    return this.apollo.query({
      query: usuarioEnListaEspera,
      variables: {
        usuarioId: usuarioId,
        eventoId: eventoId
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    }).pipe(
      map((result: any) => {
        console.log('📦 Respuesta verificación lista de espera:', result);

        if (result.data?.usuarioEnListaEspera) {
          const response = result.data.usuarioEnListaEspera;
          return {
            status: response.status,
            message: response.message,
            enListaEspera: response.enListaEspera || false,
            listaEspera: response.registro ? [response.registro] : null
          };
        } else {
          console.warn('⚠️ Respuesta inesperada del servidor');
          return {
            status: false,
            message: 'Respuesta inesperada del servidor',
            enListaEspera: false,
            listaEspera: null
          };
        }
      }),
      catchError((error: any) => {
        console.error('❌ Error al verificar usuario en lista de espera:', error);
        return of({
          status: false,
          message: error.message || 'Error al verificar lista de espera',
          enListaEspera: false,
          listaEspera: null,
          error: error.message
        });
      })
    );
  }





}
