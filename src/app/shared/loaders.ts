import { Component } from '@angular/core';

const AVISO = 'Puede tardar hasta 50 segundos en cargar el backend por limitaciones en el compute.';

/** Spinner de árbol (Uiverse, NlghtM4re) para la carga del mapa. */
@Component({
  selector: 'ceba-loader-arbol',
  template: `
    <div class="loader-box" role="status" aria-live="polite">
      <div class="tree-loader" aria-hidden="true">
        <div class="tree">
          @for (x of ramas; track x) {
            <div class="branch" [style.--x]="x">
              @for (i of caras; track i) {
                <span [style.--i]="i"></span>
              }
            </div>
          }
          <div class="stem">
            @for (i of caras; track i) {
              <span [style.--i]="i"></span>
            }
          </div>
          <span class="shadow"></span>
        </div>
      </div>
      <strong>Cargando el mapa…</strong>
      <p>${AVISO}</p>
    </div>
  `,
  host: { style: 'display:contents' },
})
export class LoaderArbolComponent {
  protected readonly ramas = [0, 1, 2, 3];
  protected readonly caras = [0, 1, 2, 3];
}

/** Spinner estilo matrix (Uiverse, PriyanshuGupta28) para cuando se simula una parcela. */
@Component({
  selector: 'ceba-loader-matrix',
  template: `
    <div class="loader-box" role="status" aria-live="polite">
      <div class="ai-matrix-loader" aria-hidden="true">
        @for (d of digitos; track $index) {
          <div class="digit">{{ d }}</div>
        }
        <div class="glow"></div>
      </div>
      <strong>Calculando la simulación…</strong>
      <p>${AVISO}</p>
    </div>
  `,
  host: { style: 'display:contents' },
})
export class LoaderMatrixComponent {
  protected readonly digitos = [0, 1, 0, 1, 1, 0, 0, 1];
}
