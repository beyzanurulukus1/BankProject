import { CommonModule } from '@angular/common';

import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';

import {
  HistoricalPrice,
  InvestmentService,
  PortfolioPosition,
  Stock
} from '../../../core/services/investment';


@Component({
  selector: 'app-stock-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './stock-detail-dialog.html',
  styleUrl: './stock-detail-dialog.css'
})
export class StockDetailDialog implements OnInit {

  // =========================
  // SERVICES
  // =========================

  private investmentService =
    inject(InvestmentService);

  private formBuilder =
    inject(FormBuilder);

  private cdr =
    inject(ChangeDetectorRef);


  // =========================
  // DIALOG
  // =========================

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public stock: Stock,

    private dialogRef:
      MatDialogRef<StockDetailDialog>
  ) {

    Chart.register(...registerables);

  }


  // =========================
  // UI STATE
  // =========================

  submitting = false;

  errorMessage = '';


  // =========================
  // CHART
  // =========================

  chart: Chart | null = null;

  selectedPeriod = '1mo';

  history: HistoricalPrice[] = [];


  // =========================
  // BUY
  // =========================

  buyForm =
    this.formBuilder.group({

      quantity: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ]

    });


  // =========================
  // SELL
  // =========================

  sellForm =
    this.formBuilder.group({

      quantity: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ]

    });

  portfolioPosition:
    PortfolioPosition | null = null;


  // =========================
  // LIFECYCLE
  // =========================

  ngOnInit(): void {

    this.loadHistory();

    this.loadPortfolioPosition();

  }


  // =========================
  // HISTORICAL DATA
  // =========================

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

          this.history =
            response.data;

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


  // =========================
  // CHANGE CHART PERIOD
  // =========================

  changePeriod(
    period: string
  ): void {

    this.selectedPeriod =
      period;

    if (this.chart) {

      this.chart.destroy();

      this.chart = null;

    }

    this.loadHistory();

  }


  // =========================
  // CREATE CHART
  // =========================

  createChart(): void {

    const canvas =
      document.getElementById(
        'stockChart'
      ) as HTMLCanvasElement | null;


    if (
      !canvas ||
      this.history.length === 0
    ) {

      return;

    }


    // Önce eski chart varsa temizle
    if (this.chart) {

      this.chart.destroy();

      this.chart = null;

    }


    const labels =
      this.history.map(item =>

        new Date(
          item.date
        ).toLocaleDateString(
          'tr-TR',
          {
            day: '2-digit',
            month: '2-digit'
          }
        )

      );


    const prices =
      this.history.map(
        item => item.close
      );


    const config:
      ChartConfiguration = {

      type: 'line',

      data: {

        labels,

        datasets: [

          {
            data: prices,

            borderWidth: 2,

            tension: 0.35,

            pointRadius: 0,

            fill: false
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


    this.chart =
      new Chart(
        canvas,
        config
      );

  }


  // =========================
  // BUY GETTERS
  // =========================

  get quantity(): number {

    return Number(
      this.buyForm
        .get('quantity')
        ?.value ?? 0
    );

  }


  get estimatedTotal(): number {

    return (
      this.quantity *
      this.stock.price
    );

  }


  get canBuy(): boolean {

    return (

      this.buyForm.valid &&

      this.quantity > 0 &&

      !this.submitting

    );

  }


  // =========================
  // BUY
  // =========================

  buy(): void {

    if (!this.canBuy) {

      this.buyForm
        .markAllAsTouched();

      return;

    }


    this.submitting = true;

    this.errorMessage = '';


    this.investmentService
      .buyStock({

        symbol:
          this.stock.symbol,

        quantity:
          this.quantity

      })
      .subscribe({

        next: (response) => {

          console.log(
            '✅ HİSSE SATIN ALINDI:',
            response
          );


          this.dialogRef.close({

            type: 'BUY',

            result:
              response.data

          });

        },


        error: (err) => {

          console.error(
            '❌ Hisse satın alınamadı:',
            err
          );


          this.submitting = false;


          this.errorMessage =
            err?.error?.message ??
            'Hisse satın alma işlemi gerçekleştirilemedi.';


          this.cdr.detectChanges();

        }

      });

  }


  // =========================
  // PORTFOLIO POSITION
  // =========================

  loadPortfolioPosition(): void {

    this.investmentService
      .getPortfolio()
      .subscribe({

        next: (response) => {

          this.portfolioPosition =

            response.data.positions.find(
              position =>
                position.symbol ===
                this.stock.symbol
            ) ?? null;


          console.log(
            '✅ POZİSYON:',
            this.portfolioPosition
          );


          this.cdr.detectChanges();

        },


        error: (err) => {

          console.error(
            '❌ Portföy pozisyonu alınamadı:',
            err
          );

        }

      });

  }


  // =========================
  // SELL GETTERS
  // =========================

  get sellQuantity(): number {

    return Number(
      this.sellForm
        .get('quantity')
        ?.value ?? 0
    );

  }


  get estimatedSellTotal(): number {

    return (
      this.sellQuantity *
      this.stock.price
    );

  }


  get canSell(): boolean {

    if (!this.portfolioPosition) {

      return false;

    }


    return (

      this.sellForm.valid &&

      this.sellQuantity > 0 &&

      this.sellQuantity <=
        this.portfolioPosition.quantity &&

      !this.submitting

    );

  }


  // =========================
  // SELL
  // =========================

  sell(): void {

    if (!this.canSell) {

      this.sellForm
        .markAllAsTouched();

      return;

    }


    this.submitting = true;

    this.errorMessage = '';


    this.investmentService
      .sellStock({

        symbol:
          this.stock.symbol,

        quantity:
          this.sellQuantity

      })
      .subscribe({

        next: (response) => {

          console.log(
            '✅ HİSSE SATILDI:',
            response
          );


          this.dialogRef.close({

            type: 'SELL',

            result:
              response.data

          });

        },


        error: (err) => {

          console.error(
            '❌ Hisse satılamadı:',
            err
          );


          this.submitting = false;


          this.errorMessage =
            err?.error?.message ??
            'Hisse satış işlemi gerçekleştirilemedi.';


          this.cdr.detectChanges();

        }

      });

  }


  // =========================
  // HELPERS
  // =========================

  isPositive(
    value: number
  ): boolean {

    return value >= 0;

  }


  formatPercent(
    value: number
  ): string {

    return `${(
      value * 100
    ).toFixed(2)}%`;

  }


  // =========================
  // DESTROY
  // =========================

  ngOnDestroy(): void {

    if (this.chart) {

      this.chart.destroy();

      this.chart = null;

    }

  }

}