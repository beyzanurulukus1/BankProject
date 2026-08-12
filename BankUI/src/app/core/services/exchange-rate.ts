import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  buyingRate: number;
  sellingRate: number;
  rate: number;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {

  private http = inject(HttpClient);

  getRates() {
    return this.http.get<{
      isSuccess: boolean;
      data: ExchangeRate[];
    }>(`${environment.apiUrl}/ExchangeRate`);
  }
}