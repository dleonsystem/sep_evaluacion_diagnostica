import { Injectable } from '@angular/core';

export interface RespuestaCargaPdf {
  ok: boolean;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AdminUploadService {
  private readonly endpointCarga = '/api/admin/pdf';

  async subirPdf(file: File, token: string): Promise<RespuestaCargaPdf> {
    const formData = new FormData();
    formData.append('archivo', file, file.name);
    formData.append('token', token);

    // TODO: Reemplazar por el endpoint real cuando esté disponible.
    // return firstValueFrom(
    //   this.http.post<RespuestaCargaPdf>(this.endpointCarga, formData, {
    //     headers: { Authorization: `Bearer ${token}` }
    //   })
    // );

    return {
      ok: true,
      mensaje: `Carga simulada: el PDF fue adjuntado al FormData en modo mock (${this.endpointCarga}).`
    };
  }
}
