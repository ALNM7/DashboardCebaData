import { Component, computed, inject, resource } from '@angular/core';

import { CebaApi } from '../../core/api/ceba-api';
import { fmt, fmtSigned } from '../../core/format';
import { CandidatoMetricas } from '../../core/models';
import { b, fila, filaSub, tip } from '../../core/tooltip';
import { HbarChart, ItemBarra } from '../../shared/charts/hbar-chart';
import { HistogramChart } from '../../shared/charts/histogram-chart';
import { GrupoDispersion, ScatterChart } from '../../shared/charts/scatter-chart';
import { IconComponent } from '../../shared/icon';
import { ErrorStateComponent, SkelCardComponent } from '../../shared/states';

const SUB: Record<string, string> = {
  CRC: 'Residuos de cultivo en el suelo', NDTI: 'Labranza y residuos', MSI: 'Estrés de humedad', NDDI: 'Señal de sequía',
  NDWI: 'Agua en las hojas', LAI: 'Densidad de hojas', NDVI: 'Verdor del cultivo', FAPAR: 'Luz que absorbe el cultivo',
  Clima: 'Lluvia y temperatura', 'Ubicación': 'Latitud, longitud, estado y municipio', 'Topografía': 'Elevación y pendiente',
  'NDVI histórico': 'Verdor de ciclos anteriores', 'Área': 'Tamaño de la parcela', Suelo: 'Propiedades del suelo (SoilGrids)',
};

export const GRUPOS: Record<string, GrupoDispersion> = {
  Puebla: { nombre: 'Puebla', color: 'var(--st-puebla)', forma: 'circulo' },
  Hidalgo: { nombre: 'Hidalgo', color: 'var(--st-hidalgo)', forma: 'cuadro' },
  Tlaxcala: { nombre: 'Tlaxcala', color: 'var(--st-tlaxcala)', forma: 'triangulo' },
};

const RUIDO = 0.01;

@Component({
  selector: 'ceba-modelo-page',
  imports: [IconComponent, SkelCardComponent, ErrorStateComponent, HbarChart, ScatterChart, HistogramChart],
  templateUrl: './modelo-page.html',
  host: { style: 'display:contents' },
})
export class ModeloPage {
  private readonly api = inject(CebaApi);
  protected readonly metricas = resource({ loader: () => this.api.metricas() });
  protected readonly fmt = fmt;
  protected readonly fmtSigned = fmtSigned;
  protected readonly Math = Math;
  protected readonly gruposLista = Object.values(GRUPOS);
  protected readonly grupos = GRUPOS;

  protected readonly m = computed(() => (this.metricas.hasValue() ? this.metricas.value() : undefined));
  protected readonly v = computed(() => this.m()?.validacion);
  protected readonly mejora = computed(() => {
    const v = this.v();
    return v ? Math.round(((v.baseline.rmse - v.rmse) / v.baseline.rmse) * 100) : 0;
  });
  protected readonly n = computed(() => this.m()?.n_parcelas ?? { total: 197, medidas: 138, ocultas: 59 });

  /* ---------- error por modelo ---------- */
  private readonly minRmse = computed(() => Math.min(...(this.m()?.modelos ?? []).filter((x) => !x.referencia).map((x) => x.rmse)));
  protected readonly modelos = computed<ItemBarra[]>(() =>
    (this.m()?.modelos ?? []).map((x) => ({
      label: x.nombre,
      value: x.rmse,
      cls: x.referencia ? 'mute' : x.elegido ? 'strong' : '',
      key: !!x.elegido,
      flag: x.elegido ? 'Modelo usado' : !x.referencia && x.rmse === this.minRmse() ? 'Menor RMSE' : '',
      tip: tip(
        x.nombre,
        fila('RMSE: ', b(fmt(x.rmse, 3)), ' t/ha'),
        filaSub(x.referencia ? 'Siempre predice el promedio de las parcelas' : (x.detalle ? x.detalle + '. ' : '') + 'Validación cruzada anidada'),
      ),
    })),
  );
  protected readonly lecturaModelos = computed(() => {
    const m = this.m();
    const v = this.v();
    if (!m || !v) return '';
    const elegido = m.modelos.find((x) => x.elegido);
    const ref = Math.round(((v.baseline.rmse - this.minRmse()) / v.baseline.rmse) * 100);
    if (!elegido) return `El mejor modelo reduce el error cerca de ${ref} % frente a predecir el promedio.`;
    const dif = elegido.rmse - this.minRmse();
    const mejor = m.modelos.filter((x) => !x.referencia).sort((a, c) => a.rmse - c.rmse)[0];
    const empate = dif < RUIDO
      ? `Queda a menos de ${fmt(RUIDO, 3)} t/ha del menor RMSE (${mejor.nombre}, ${fmt(mejor.rmse, 3)}): esa diferencia está dentro del ruido de la validación.`
      : `Su RMSE es ${fmt(dif, 3)} t/ha mayor que el del mejor (${mejor.nombre}, ${fmt(mejor.rmse, 3)}).`;
    return `El modelo usado es ${elegido.nombre} (${fmt(elegido.rmse, 3)}). ${empate} Reduce el error cerca de ${Math.round(((v.baseline.rmse - elegido.rmse) / v.baseline.rmse) * 100)} % frente a predecir el promedio.`;
  });

  protected readonly importancia = computed<ItemBarra[]>(() =>
    (this.m()?.importancia_familias ?? []).map((x, i) => ({ label: x.familia, sub: SUB[x.familia] ?? '', value: x.valor, key: i === 0 })),
  );
  protected readonly maxImportancia = computed(() => Math.max(0.1, ...(this.m()?.importancia_familias ?? []).map((x) => x.valor)) * 1.2);

  /* ---------- comparación de enfoques ---------- */
  protected readonly candidatos = computed(() => this.m()?.candidatos ?? []);
  private itemsCandidatos(clave: 'estratificada' | 'lomo'): ItemBarra[] {
    return this.candidatos().map((c) => ({
      label: c.nombre, value: c[clave].rmse, key: c.elegido, cls: c.elegido ? 'strong' : '', flag: c.elegido ? 'Modelo usado' : '',
      tip: tip(c.nombre, fila('RMSE: ', b(fmt(c[clave].rmse, 3)), ' t/ha'), fila('MAE: ', b(fmt(c[clave].mae, 3)), ' t/ha · R²: ', b(fmt(c[clave].r2, 2))), filaSub(c.descripcion)),
    }));
  }
  protected readonly itemsEstratificada = computed(() => this.itemsCandidatos('estratificada'));
  protected readonly itemsLomo = computed(() => this.itemsCandidatos('lomo'));
  protected readonly refLomo = computed(() => {
    const r = this.m()?.lomo_media_resto;
    return r ? { value: r.rmse, label: `${r.nombre} ${fmt(r.rmse, 3)}` } : undefined;
  });
  protected readonly refBase = computed(() => {
    const v = this.v();
    return v ? { value: v.baseline.rmse, label: `Promedio ${fmt(v.baseline.rmse, 3)}` } : undefined;
  });
  protected readonly maxComparacion = computed(() => Math.max(1.0, (this.m()?.lomo_media_resto?.rmse ?? 0) * 1.08));
  protected readonly lecturaCandidatos = computed(() => {
    const c = this.candidatos();
    if (c.length < 3) return [];
    const mejorEst = Math.min(...c.map((x) => x.estratificada.rmse));
    const empatados = c.filter((x) => x.estratificada.rmse - mejorEst < RUIDO);
    const mejorLomo = [...c].sort((a, d) => a.lomo.rmse - d.lomo.rmse)[0];
    const peorLomo = [...c].sort((a, d) => d.lomo.rmse - a.lomo.rmse)[0];
    const frases: string[] = [];
    frases.push(
      empatados.length > 1
        ? `Donde se califica, ${lista(empatados)} quedan empatados en RMSE (la diferencia es menor a ${fmt(RUIDO, 3)} t/ha, dentro del ruido).`
        : `Donde se califica, ${empatados[0].nombre.toLowerCase()} tiene el menor RMSE (${fmt(mejorEst, 3)}).`,
    );
    frases.push(`En una zona nueva de la región, ${mejorLomo.nombre.toLowerCase()} es el mejor (${fmt(mejorLomo.lomo.rmse, 3)}) y ${peorLomo.nombre.toLowerCase()} es el que más se cae (${fmt(peorLomo.lomo.rmse, 3)}).`);
    const el = c.find((x) => x.elegido);
    if (el && el.id !== mejorLomo.id && el.id !== peorLomo.id) {
      frases.push(`${el.nombre} queda en medio: ${fmt(el.lomo.rmse - mejorLomo.lomo.rmse, 3)} t/ha por encima del mejor en zonas nuevas, pero mucho mejor que ${peorLomo.nombre.toLowerCase()}.`);
    }
    return frases;
  });

  /* ---------- dispersión y errores ---------- */
  protected readonly puntos = computed(() => (this.m()?.dispersion ?? []).map((d) => ({ id: d.id, mun: d.municipio, g: d.estado, x: d.obs, y: d.pred })));
  protected readonly dentroMedio = computed(() => {
    const r = this.m()?.residuales ?? [];
    return r.length ? Math.round((r.filter((x) => Math.abs(x) <= 0.5).length / r.length) * 100) : 0;
  });

  /* ---------- robustez ---------- */
  protected readonly robustez = computed<ItemBarra[]>(() => {
    const v = this.v();
    return (this.m()?.robustez_espacial ?? []).map((x) => {
      const alto = !!v && x.rmse > 0.6;
      return {
        label: x.municipio, value: x.rmse, cls: alto ? 'warn' : '', flag: alto ? '▲ Más error' : '',
        tip: tip(
          x.municipio,
          fila('RMSE al dejarlo fuera: ', b(fmt(x.rmse, 2)), ' t/ha', x.n ? ` (${x.n} parcelas)` : ''),
          filaSub(alto && v ? `Es ${fmt(x.rmse / v.rmse, 1)} veces el error global` : 'Cerca o por debajo del error global'),
        ),
      };
    });
  });
}

function lista(c: CandidatoMetricas[]): string {
  const n = c.map((x) => x.nombre.toLowerCase());
  return n.length > 1 ? n.slice(0, -1).join(', ') + ' y ' + n[n.length - 1] : n[0];
}
