/* Tipos de la API. Son los mismos que sirve cebadata_api (ver el README de ese repo). */

export type Conjunto = 'ENTRENAMIENTO' | 'PREDICCION';
export type FuenteSatelital = 'S2' | 'Planet';
export type IndiceId = 'ndvi' | 'evi' | 'lai' | 'nddi' | 'ndwi';

export interface Parcela {
  id: string;
  estado: string;
  municipio: string;
  area_ha: number;
  conjunto: Conjunto;
  rendimiento_obs: number | null;
  rendimiento_pred: number;
  intervalo_inf: number;
  intervalo_sup: number;
  lat: number;
  lon: number;
  elevacion_m: number;
  pendiente_grados: number;
}

export interface PuntoSerie {
  fecha: string;
  fuente: FuenteSatelital;
  indice: IndiceId;
  valor: number;
}

export interface ClimaMes {
  mes: number;
  prec_mm: number;
  tmax_c: number;
  tmin_c: number;
}

export interface ItemShap {
  variable: string;
  etiqueta: string;
  valor_variable: number;
  unidad: string;
  contribucion: number;
}

export interface Vecino {
  id: string;
  municipio: string;
  distancia_km: number;
  rendimiento: number;
  tipo: 'observado' | 'predicho';
}

export interface DetalleParcela {
  parcela: Parcela;
  serie: PuntoSerie[];
  clima: ClimaMes[];
  shap: ItemShap[];
  shap_otras: number;
  base: number;
  vecinos: Vecino[];
}

export interface MetricasValidacion {
  rmse: number;
  mae: number;
  r2: number;
  sesgo?: number;
}

export interface Validacion extends MetricasValidacion {
  esquema: string;
  baseline: { nombre: string; rmse: number; r2: number };
}

/** Una fila de la tabla estática de la metodología: los tres enfoques que se compararon. */
export interface FilaComparacion {
  id: string;
  nombre: string;
  descripcion: string;
  elegido: boolean;
  n_variables: number;
  estratificada: MetricasValidacion;
  lomo: MetricasValidacion;
}

export interface PuntoDispersion {
  id: string;
  estado: string;
  municipio: string;
  obs: number;
  pred: number;
}

export interface ItemEtiquetado {
  etiqueta: string;
  valor: number;
}

export interface BloqueAblacion {
  etiqueta: string;
  clave?: string;
  rmse: number;
  n_variables?: number;
}

export interface Hallazgos {
  indices: ItemEtiquetado[];
  dentro_ndvi: ItemEtiquetado[];
  clima: ItemEtiquetado[];
  bloques: BloqueAblacion[];
  familia_clima?: number;
}

export interface RangoEntrenamiento {
  lluvia_mayo: { min: number; max: number };
  tmin_abril: { min: number; max: number };
}

export interface Metricas {
  modelo: { nombre: string; descripcion: string; n_variables: number };
  validacion: Validacion;
  lomo: Validacion;
  comparacion: FilaComparacion[];
  dispersion: PuntoDispersion[];
  residuales: number[];
  importancia_familias: { familia: string; valor: number }[];
  robustez_espacial: { municipio: string; rmse: number; n?: number }[];
  hallazgos: Hallazgos;
  n_parcelas?: { total: number; medidas: number; ocultas: number };
  rango_entrenamiento: RangoEntrenamiento;
}

export interface PeticionSimulador {
  id: string;
  delta_lluvia_mayo_pct: number;
  delta_tmin_abril_c: number;
}

export interface FueraDeRango {
  variable: string;
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  unidad: string;
}

export interface PrediccionIntervalo {
  pred: number;
  inf: number;
  sup: number;
}

export interface RespuestaSimulador {
  id: string;
  base: PrediccionIntervalo;
  escenario: PrediccionIntervalo;
  diferencia: number;
  diferencia_pct: number;
  entradas: {
    lluvia_mayo_base: number;
    lluvia_mayo_escenario: number;
    tmin_abril_base: number;
    tmin_abril_escenario: number;
  };
  fuera_de_rango: FueraDeRango[];
  rango_entrenamiento: RangoEntrenamiento;
}

export type NivelRiesgo = 'bajo' | 'medio' | 'alto';
