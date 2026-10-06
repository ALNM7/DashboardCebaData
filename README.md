# CebaData

Dashboard web en español para consultar un modelo de machine learning que predice el rendimiento de cebada (t/ha) en 197 parcelas del altiplano de Hidalgo, Puebla y Tlaxcala, ciclo abril a octubre de 2025.

Los datos que muestra son **simulados** (semilla fija, siempre iguales) y siguen la estructura de la API real.

## Cómo abrirlo

No necesita instalación ni compilación. Sirve la carpeta con cualquier servidor estático:

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

También funciona abriendo `index.html` directamente. El mapa base (datos de OpenStreetMap con estilo claro de CARTO) y la tipografía Inter se cargan por internet. Leaflet va incluido en `vendor/`.

## Secciones

1. **Mapa de parcelas**: 197 parcelas con color por rendimiento (verde claro = bajo, oscuro = alto), borde punteado para las predichas, filtros, KPIs, tabla ordenable y exportación a CSV. También puede colorearse por riesgo crediticio.
2. **Ficha de parcela**: predicción con intervalo, curva de índices satelitales (NDVI, EVI, LAI, NDDI, NDWI; Sentinel-2 o Planet), clima mensual, cascada tipo SHAP y 5 parcelas vecinas.
3. **Desempeño del modelo**: métricas de validación cruzada anidada, comparación de modelos, dispersión, residuales, importancia por familia, robustez espacial y metodología.
4. **Hallazgos clave**: tres tarjetas narrativas con mini gráfica.
5. **Simulador y riesgo crediticio**: escenarios de lluvia de mayo y temperatura mínima de abril, con aviso de rango, y semáforo de riesgo con precio y costo editables.

## Estructura

```
index.html          Estructura, navegación y carga de scripts
css/styles.css      Estilos, modo claro y oscuro, responsive
js/data.js          Capa de datos (único lugar con datos simulados)
js/ui.js            Iconos, formato, tooltip, estado compartido, reglas de riesgo
js/charts.js        Gráficas en SVG y HTML sin librerías
js/views/*.js       Una vista por sección
js/app.js           Arranque, rutas (#/mapa, #/parcela/ID, ...) y tema
vendor/leaflet/     Leaflet 1.9.4
```

## Conectar una API real

Todo el dashboard pide sus datos solo a través de `CebaApi` (`js/data.js`). Para usar un servidor propio:

```js
CebaApi.configurar({ baseUrl: "https://mi-servidor" });
```

Endpoints esperados:

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/parcelas` | lista de parcelas |
| GET | `/api/parcelas/:id` | `{ parcela, serie, clima, shap, shap_otras, base, vecinos }` |
| GET | `/api/modelo/metricas` | métricas, modelos, dispersión, residuales, importancias, robustez y hallazgos |
| POST | `/api/simulador` | recibe `{ id, delta_lluvia_mayo_pct, delta_tmin_abril_c }` |

Los campos de cada parcela, serie, clima y shap son los de la especificación del proyecto. `data.js` documenta además los campos extra que se usan (por ejemplo `unidad` en `shap`, o `fuera_de_rango` en el simulador).

## Reglas de riesgo

Equilibrio = costo por hectárea / precio por tonelada.

- **Riesgo bajo**: el límite inferior del intervalo es mayor o igual al equilibrio.
- **Riesgo medio**: la predicción supera el equilibrio, pero el límite inferior no.
- **Riesgo alto**: la predicción queda por debajo del equilibrio.

Herramienta de apoyo; no sustituye la evaluación crediticia.

## Accesibilidad

Ni el riesgo ni el conjunto se comunican solo con color: siempre hay icono, forma o etiqueta. Las gráficas tienen tooltip, leyenda visible y, cuando hay muchos puntos, una tabla alternativa. El mapa se complementa con la tabla, que se recorre con teclado.
