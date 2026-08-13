import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { MatDialog } from '@angular/material/dialog';

import {
  InvestmentService,
  MarketIndex,
  Stock
} from '../../core/services/investment';

import { StockDetailDialog } from './stock-detail-dialog/stock-detail-dialog';
@Component({
  selector: 'app-investment',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: 'investment.html',
  styleUrl: 'investment.css'
})
export class InvestmentComponent implements OnInit {

  private investmentService = inject(InvestmentService);
  private cdr = inject(ChangeDetectorRef);
private dialog = inject(MatDialog);

  index: MarketIndex | null = null;

  stocks: Stock[] = [];

  loading = true;

  errorMessage = '';

  readonly popularSymbols = [
    'THYAO',
    'ASELS',
    'GARAN'
  ];

  ngOnInit(): void {

    this.loadMarketData();
  }

  loadMarketData(): void {

    this.loading = true;
    this.errorMessage = '';

    this.investmentService
      .getIndex('XU100')
      .subscribe({

        next: (response) => {

          console.log('✅ BIST 100:', response);

          this.index = response.data;

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

    this.popularSymbols.forEach(symbol => {

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

    });
  }

  isPositive(value: number): boolean {
    return value >= 0;
  }

  formatPercent(value: number): string {

    return `${(value * 100).toFixed(2)}%`;
  }
openStockDetail(stock: Stock): void {

  this.dialog.open(StockDetailDialog, {
    width: '520px',
    maxWidth: '95vw',
    data: stock
  });

}
}