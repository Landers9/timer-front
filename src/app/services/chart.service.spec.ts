import { TestBed } from '@angular/core/testing';
import { ChartService } from './chart.service';
import { Chart, ChartConfiguration } from 'chart.js';

describe('ChartService', () => {
  let service: ChartService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createChart', () => {
    it('should call new Chart with canvas and config', () => {
      const canvas = document.createElement('canvas');
      const config: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{ label: 'Test', data: [10, 20, 30] }],
        },
      };

      const chart = service.createChart(canvas, config);

      expect(chart).toBeInstanceOf(Chart);

      if (chart) chart.destroy();
    });
  });

  describe('destroyChart', () => {
    it('should not throw when chart is null', () => {
      expect(() => service.destroyChart(null)).not.toThrow();
    });

    it('should call destroy on chart', () => {
      const mockChart = { destroy: jest.fn() } as unknown as Chart;

      service.destroyChart(mockChart);

      expect(mockChart.destroy).toHaveBeenCalled();
    });
  });
});
