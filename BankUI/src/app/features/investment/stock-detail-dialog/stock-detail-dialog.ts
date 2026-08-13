import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectorRef,
  Inject,
  OnInit,
  inject
} from '@angular/core';

import {
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';

import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';

import {
  HistoricalPrice,
  InvestmentService,
  Stock
} from '../../../core/services/investment';

@Component({
  selector: 'app-stock-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule
  ],
  templateUrl: './stock-detail-dialog.html',
  styleUrl: './stock-detail-dialog.css'
})
export class StockDetailDialog implements OnInit {

  private investmentService = inject(InvestmentService);
  private cdr = inject(ChangeDetectorRef);

  chart: Chart | null = null;

  selectedPeriod = '1mo';

  history: HistoricalPrice[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public stock: Stock
  ) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {

    this.investmentService
      .getHistoricalData(
        this.stock.symbol,
        this.selectedPeriod,
        '1d'
      )
      .subscribe({

        next: (response) => {

          console.log(
            '✅ GEÇMİŞ VERİ:',
            response
          );

          this.history = response.data;

          this.cdr.detectChanges();

          setTimeout(() => {
            this.createChart();
          });

        },

        error: (err) => {

          console.error(
            '❌ Geçmiş fiyatlar alınamadı:',
            err
          );

        }

      });
  }

  changePeriod(period: string): void {

    this.selectedPeriod = period;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    this.loadHistory();
  }

  createChart(): void {

    const canvas =
      document.getElementById(
        'stockChart'
      ) as HTMLCanvasElement | null;

    if (!canvas || this.history.length === 0) {
      return;
    }

    const labels = this.history.map(item =>
      new Date(item.date).toLocaleDateString(
        'tr-TR',
        {
          day: '2-digit',
          month: '2-digit'
        }
      )
    );

    const prices = this.history.map(
      item => item.close
    );

    const config: ChartConfiguration = {

      type: 'line',

      data: {

        labels,

        datasets: [
          {
            data: prices,

            borderWidth: 2,

            tension: 0.35,

            pointRadius: 0
          }
        ]
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {
            display: false
          }

        },

        scales: {

          x: {

            grid: {
              display: false
            }

          },

          y: {

            grid: {
              display: false
            }

          }

        }

      }

    };

    this.chart = new Chart(
      canvas,
      config
    );
  }
  isPositive(value: number): boolean {
  return value >= 0;
}

formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
}