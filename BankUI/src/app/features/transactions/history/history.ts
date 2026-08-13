import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import { TransactionService } from '../../../core/services/transaction';
import { TransactionHistory } from '../../../core/models/transaction-history';

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
  private cdr = inject(ChangeDetectorRef);

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

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('HAREKETLER GETİRİLEMEDİ');
        console.error(err);

        this.loading = false;

        this.cdr.detectChanges();
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

      case 'EXCHANGE':
        return 'Döviz Dönüşümü';

      default:
        return type;
    }
  }

}