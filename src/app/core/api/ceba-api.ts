import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DatosDemo } from '../demo/demo-data';
import { DetalleParcela, Metricas, Parcela, PeticionSimulador, RespuestaSimulador } from '../models';

/** Error de la API con el código HTTP, para distinguir un 404 de una caída. */
export class ErrorApi extends Error {
  constructor(mensaje: string, readonly status?: number) {
    super(mensaje);
  }
}

/**
 * Todo el dashboard obtiene sus datos solo a través de esta clase.
 * Endpoints (los sirve cebadata_api):
 *   GET  /api/parcelas            lista de parcelas
 *   GET  /api/parcelas/:id        ficha de una parcela
 *   GET  /api/modelo/metricas     métricas, comparación de candidatos y hallazgos
 *   POST /api/simulador           escenario de lluvia de mayo y Tmin de abril
 */
export abstract class CebaApi {
  abstract parcelas(): Promise<Parcela[]>;
  abstract parcela(id: string): Promise<DetalleParcela>;
  abstract metricas(): Promise<Metricas>;
  abstract simular(cuerpo: PeticionSimulador): Promise<RespuestaSimulador>;
}

@Injectable()
export class HttpCebaApi extends CebaApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl.replace(/\/$/, '');

  parcelas() {
    return this.pedir<Parcela[]>('GET', '/api/parcelas');
  }
  parcela(id: string) {
    return this.pedir<DetalleParcela>('GET', `/api/parcelas/${encodeURIComponent(id)}`);
  }
  metricas() {
    return this.pedir<Metricas>('GET', '/api/modelo/metricas');
  }
  simular(cuerpo: PeticionSimulador) {
    return this.pedir<RespuestaSimulador>('POST', '/api/simulador', cuerpo);
  }

  private async pedir<T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown): Promise<T> {
    try {
      return await firstValueFrom(this.http.request<T>(metodo, this.base + ruta, { body: cuerpo }));
    } catch (e) {
      if (e instanceof HttpErrorResponse) {
        const detalle = typeof e.error?.error === 'string' ? e.error.error : null;
        if (e.status === 0) throw new ErrorApi('No se pudo conectar con el servidor de datos.', 0);
        throw new ErrorApi(detalle ?? `Error ${e.status} en ${ruta}`, e.status);
      }
      throw e;
    }
  }
}

/** Respuestas simuladas en el navegador (configuración `demo`). */
@Injectable()
export class DemoCebaApi extends CebaApi {
  private readonly datos = new DatosDemo();

  parcelas() {
    return this.esperar(() => this.datos.listaParcelas());
  }
  parcela(id: string) {
    return this.esperar(() => {
      const d = this.datos.detalle(id);
      if (!d) throw new ErrorApi('Parcela no encontrada', 404);
      return d;
    });
  }
  metricas() {
    return this.esperar(() => this.datos.metricas());
  }
  simular(cuerpo: PeticionSimulador) {
    return this.esperar(() => {
      const r = this.datos.simular(cuerpo);
      if (!r) throw new ErrorApi('Parcela no encontrada', 404);
      return r;
    });
  }

  private esperar<T>(f: () => T): Promise<T> {
    const ms = 140 + Math.random() * 180;
    return new Promise<T>((ok, no) =>
      setTimeout(() => {
        try {
          ok(f());
        } catch (e) {
          no(e);
        }
      }, ms),
    );
  }
}
