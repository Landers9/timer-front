// src/app/services/chart.service.ts
import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

@Injectable({
  providedIn: 'root',
})
export class ChartService {
  constructor() {
    // Enregistrer tous les composants Chart.js
    Chart.register(...registerables);
  }

  createChart(canvas: HTMLCanvasElement, config: ChartConfiguration): Chart {
    return new Chart(canvas, config);
  }

  destroyChart(chart: Chart | null): void {
    if (chart) {
      chart.destroy();
    }
  }
}
