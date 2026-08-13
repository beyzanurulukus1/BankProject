import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Stock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  timestamp: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private http = inject(HttpClient);

  getStock(symbol: string) {
    return this.http.get<{
      isSuccess: boolean;
      data: Stock;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/stock/${symbol}`
    );
  }

  getIndex(symbol: string) {
    return this.http.get<{
      isSuccess: boolean;
      data: MarketIndex;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/index/${symbol}`
    );
  }
}