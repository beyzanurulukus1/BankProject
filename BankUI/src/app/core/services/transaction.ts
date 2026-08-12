import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TransactionHistory } from '../models/transaction-history';


@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private http = inject(HttpClient);

  getHistory() {
    return this.http.get<{
      isSuccess: boolean;
      count: number;
      data: TransactionHistory[];
    }>(`${environment.apiUrl}/Transaction/history`);
  }
}