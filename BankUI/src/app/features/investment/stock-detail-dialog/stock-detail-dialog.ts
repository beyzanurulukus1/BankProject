import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogModule
} from '@angular/material/dialog';

import { Stock } from '../../../core/services/investment';

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
export class StockDetailDialog {

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public stock: Stock
  ) {}

  isPositive(value: number): boolean {
    return value >= 0;
  }

  formatPercent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

}