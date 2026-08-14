import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatDialog } from '@angular/material/dialog';

import { DepositInvestmentDialog } from './deposit-investment-dialog/deposit-investment-dialog';
import { StockDetailDialog } from './stock-detail-dialog/stock-detail-dialog';

import {
  InvestmentService,
  InvestmentAccount,
  MarketIndex,
  Stock,
  Portfolio
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
export class InvestmentComponent implements OnInit {

  // =========================
  // SERVICES
  // =========================

  private investmentService = inject(InvestmentService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);


  // =========================
  // DATA
  // =========================

  investmentAccount: InvestmentAccount | null = null;

  portfolio: Portfolio | null = null;

  index: MarketIndex | null = null;

  stocks: Stock[] = [];


  // =========================
  // UI STATE
  // =========================

  loading = true;

  errorMessage = '';


  // =========================
  // CONFIG
  // =========================

  readonly popularSymbols = [
    'THYAO',
    'ASELS',
    'GARAN'
  ];


  // =========================
  // LIFECYCLE
  // =========================

  ngOnInit(): void {

    this.loadInvestmentAccount();

    this.loadPortfolio();

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
        },

        error: (err) => {

          console.error(
            '❌ Portföy alınamadı:',
            err
          );

        }

      });
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
  // DIALOGS
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

          // Para aktarımı sonrası
          // portföy/hesap verilerini de
          // yeniden güncel tutuyoruz.
          this.loadPortfolio();

        }
      );
  }


openStockDetail(stock: Stock): void {

  const dialogRef = this.dialog.open(
    StockDetailDialog,
    {
      width: '520px',
      maxWidth: '95vw',
      data: stock
    }
  );

  dialogRef.afterClosed().subscribe(
    (result) => {

      if (!result) {
        return;
      }

      if (result.type === 'BUY') {

        console.log(
          '✅ BUY tamamlandı:',
          result.result
        );

        this.loadInvestmentAccount();

        this.loadPortfolio();

      }

    }
  );
}


  // =========================
  // HELPERS
  // =========================

  isPositive(value: number): boolean {

    return value >= 0;

  }


  formatPercent(value: number): string {

    return `${(
      value * 100
    ).toFixed(2)}%`;

  }

}