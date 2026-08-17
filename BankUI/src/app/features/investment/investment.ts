import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatDialog } from '@angular/material/dialog';

import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';

import { DepositInvestmentDialog } from './deposit-investment-dialog/deposit-investment-dialog';
import { StockDetailDialog } from './stock-detail-dialog/stock-detail-dialog';

import {
  InvestmentService,
  InvestmentAccount,
  MarketIndex,
  Stock,
  Portfolio,
  InvestmentTransactionSummary,
  InvestmentTransaction
} from '../../core/services/investment';


@Component({
  selector: 'app-investment',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './investment.html',
  styleUrl: './investment.css'
})
export class InvestmentComponent
  implements OnInit, OnDestroy {


  // =========================
  // SERVICES
  // =========================

  private investmentService =
    inject(InvestmentService);

  private cdr =
    inject(ChangeDetectorRef);

  private dialog =
    inject(MatDialog);


  // =========================
  // DATA
  // =========================

  investmentAccount:
    InvestmentAccount | null = null;

  portfolio:
    Portfolio | null = null;

  investmentTransactions:
    InvestmentTransactionSummary | null = null;

  index:
    MarketIndex | null = null;

  stocks:
    Stock[] = [];


  // =========================
  // CHART
  // =========================

  portfolioChart:
    Chart | null = null;


  // =========================
  // UI STATE
  // =========================

  loading = true;

  errorMessage = '';

  showAllTransactions = false;


  // =========================
  // CONFIG
  // =========================

  readonly popularSymbols = [
    'THYAO',
    'ASELS',
    'GARAN'
  ];


  // =========================
  // CONSTRUCTOR
  // =========================

  constructor() {

    Chart.register(
      ...registerables
    );

  }


  // =========================
  // LIFECYCLE
  // =========================

  ngOnInit(): void {

    this.loadInvestmentAccount();

    this.loadPortfolio();

    this.loadInvestmentTransactions();

    this.loadMarketData();

  }


  // =========================
  // INVESTMENT ACCOUNT
  // =========================

  loadInvestmentAccount(): void {

    this.investmentService
      .getInvestmentAccount()
      .subscribe({

        next: (response) => {

          console.log(
            '✅ YATIRIM HESABI:',
            response
          );

          this.investmentAccount =
            response.data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            '❌ Yatırım hesabı alınamadı:',
            err
          );

        }

      });

  }


  // =========================
  // PORTFOLIO
  // =========================

  loadPortfolio(): void {

    this.investmentService
      .getPortfolio()
      .subscribe({

        next: (response) => {

          console.log(
            '✅ PORTFÖY:',
            response
          );

          this.portfolio =
            response.data;

          this.cdr.detectChanges();

          setTimeout(() => {

            this.createPortfolioChart();

          });

        },

        error: (err) => {

          console.error(
            '❌ Portföy alınamadı:',
            err
          );

          this.portfolio = null;

          if (this.portfolioChart) {

            this.portfolioChart.destroy();

            this.portfolioChart = null;

          }

        }

      });

  }


  // =========================
  // INVESTMENT TRANSACTIONS
  // =========================

  loadInvestmentTransactions(): void {

    this.investmentService
      .getInvestmentTransactions()
      .subscribe({

        next: (response) => {

          console.log(
            '✅ YATIRIM İŞLEM GEÇMİŞİ:',
            response
          );

          this.investmentTransactions =
            response.data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            '❌ Yatırım işlem geçmişi alınamadı:',
            err
          );

          this.investmentTransactions =
            null;

        }

      });

  }


  // =========================
  // VISIBLE TRANSACTIONS
  // =========================

  get visibleTransactions(): InvestmentTransaction[] {

    if (!this.investmentTransactions) {

      return [];

    }

    if (this.showAllTransactions) {

      return this.investmentTransactions.transactions;

    }

    return this.investmentTransactions.transactions
      .slice(0, 5);

  }


  // =========================
  // TOGGLE TRANSACTION HISTORY
  // =========================

  toggleTransactionHistory(): void {

    this.showAllTransactions =
      !this.showAllTransactions;

  }


  // =========================
  // PORTFOLIO CHART DATA
  // =========================

  getPortfolioChartData(): {
    labels: string[];
    values: number[];
  } {

    if (
      !this.portfolio ||
      this.portfolio.positions.length === 0
    ) {

      return {
        labels: [],
        values: []
      };

    }

    return {

      labels:
        this.portfolio.positions.map(
          position =>
            position.symbol
        ),

      values:
        this.portfolio.positions.map(
          position =>
            position.currentValue
        )

    };

  }


  // =========================
  // CREATE PORTFOLIO CHART
  // =========================

  createPortfolioChart(): void {

    const canvas =
      document.getElementById(
        'portfolioChart'
      ) as HTMLCanvasElement | null;


    if (
      !canvas ||
      !this.portfolio ||
      this.portfolio.positions.length === 0
    ) {

      if (this.portfolioChart) {

        this.portfolioChart.destroy();

        this.portfolioChart = null;

      }

      return;

    }


    if (this.portfolioChart) {

      this.portfolioChart.destroy();

      this.portfolioChart = null;

    }


    const chartData =
      this.getPortfolioChartData();


    const config:
      ChartConfiguration<'doughnut'> = {

      type: 'doughnut',

      data: {

        labels:
          chartData.labels,

        datasets: [

          {

            data:
              chartData.values,

            borderWidth: 2,

            hoverOffset: 6

          }

        ]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        cutout: '68%',

        plugins: {

          legend: {
            display: false
          },

          tooltip: {

            callbacks: {

              label: (context) => {

                const value =
                  Number(
                    context.raw ?? 0
                  );

                const total =
                  chartData.values.reduce(
                    (
                      sum,
                      current
                    ) =>
                      sum + current,
                    0
                  );

                const percentage =
                  total === 0
                    ? 0
                    : (
                        value / total
                      ) * 100;

                return ` ${
                  context.label
                }: ${
                  value.toLocaleString(
                    'tr-TR',
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }
                  )
                } ₺ (${
                  percentage.toFixed(2)
                }%)`;

              }

            }

          }

        }

      }

    };


    this.portfolioChart =
      new Chart(
        canvas,
        config
      );

  }


  // =========================
  // MARKET DATA
  // =========================

  loadMarketData(): void {

    this.loading = true;

    this.errorMessage = '';

    this.investmentService
      .getIndex('XU100')
      .subscribe({

        next: (response) => {

          console.log(
            '✅ BIST 100:',
            response
          );

          this.index =
            response.data;

          this.loadPopularStocks();

        },

        error: (err) => {

          console.error(
            '❌ BIST 100 alınamadı:',
            err
          );

          this.loading = false;

          this.errorMessage =
            'Piyasa verileri alınamadı.';

          this.cdr.detectChanges();

        }

      });

  }


  loadPopularStocks(): void {

    this.stocks = [];

    let completed = 0;

    this.popularSymbols.forEach(
      (symbol) => {

        this.investmentService
          .getStock(symbol)
          .subscribe({

            next: (response) => {

              console.log(
                `✅ ${symbol}:`,
                response
              );

              this.stocks.push(
                response.data
              );

              completed++;

              if (
                completed ===
                this.popularSymbols.length
              ) {

                this.loading = false;

                this.cdr.detectChanges();

              }

            },

            error: (err) => {

              console.error(
                `❌ ${symbol} alınamadı:`,
                err
              );

              completed++;

              if (
                completed ===
                this.popularSymbols.length
              ) {

                this.loading = false;

                this.cdr.detectChanges();

              }

            }

          });

      }
    );

  }


  // =========================
  // DEPOSIT DIALOG
  // =========================

  openDepositDialog(): void {

    if (!this.investmentAccount) {
      return;
    }


    const dialogRef =
      this.dialog.open(
        DepositInvestmentDialog,
        {
          width: '500px',
          maxWidth: '95vw',
          data: this.investmentAccount
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        (updatedAccount) => {

          if (!updatedAccount) {
            return;
          }


          this.investmentAccount =
            updatedAccount;


          this.cdr.detectChanges();


          this.loadPortfolio();

          this.loadInvestmentTransactions();

        }
      );

  }


  // =========================
  // STOCK DETAIL DIALOG
  // =========================

  openStockDetail(
    stock: Stock
  ): void {

    const dialogRef =
      this.dialog.open(
        StockDetailDialog,
        {
          width: '520px',
          maxWidth: '95vw',
          data: stock
        }
      );


    dialogRef
      .afterClosed()
      .subscribe(
        (result) => {

          if (!result) {
            return;
          }


          if (
            result.type === 'BUY' ||
            result.type === 'SELL'
          ) {

            console.log(
              `✅ ${result.type} tamamlandı:`,
              result.result
            );


            this.loadInvestmentAccount();

            this.loadPortfolio();

            this.loadInvestmentTransactions();

          }

        }
      );

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

    if (this.portfolioChart) {

      this.portfolioChart.destroy();

      this.portfolioChart = null;

    }

  }

}