import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../../core/services/transaction';
import { TransactionHistory } from '../../../core/models/transaction-history';
// Local minimal type to avoid import path issues

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
})
export class HistoryComponent implements OnInit {

  private transactionService = inject(TransactionService);

  transactions: TransactionHistory[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {

    this.transactionService.getHistory().subscribe({

      next: (response) => {

        console.log('HAREKETLER GELDİ');
        console.log(response);

        this.transactions = response.data;
        this.loading = false;

      },

      error: (err) => {

        console.error('HAREKETLER GETİRİLEMEDİ');
        console.error(err);

        this.loading = false;

      }

    });

  }

  getTransactionName(type: string): string {

    switch (type) {

      case 'DEPOSIT':
        return 'Para Yatırma';

      case 'WITHDRAW':
        return 'Para Çekme';

      case 'TRANSFER':
        return 'Transfer';

      default:
        return type;

    }

  }

}