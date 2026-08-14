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
export interface HistoricalPrice {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}
export interface InvestmentAccount{
    id: number;
    userId: number;
    cashBalance: number;
    createdAt: string;
}
export interface PortfolioPosition{
    symbol: string;
    quantitiy: number;
    avarageCost: number;
    currencyPrice: number;
    totalCost: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
}
export interface Portfolio{
    investmentAccountId: number;
    cashBalance: number;
    totalCost: number;
    totalValue: number;
    totalProfitLoss: number;
    totalProfitLossPercent: number;
    positions: PortfolioPosition[];}
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
  getHistoricalData(
  symbol: string,
  period: string = '1mo',
  interval: string = '1d'
) {
  return this.http.get<{
    isSuccess: boolean;
    data: HistoricalPrice[];
    message?: string;
  }>(
    `${environment.apiUrl}/Investment/history/${symbol}?period=${period}&interval=${interval}`
  );
}
getInvestmentAccount(){
    return this.http.get<{
        isSuccess: boolean;
        data: InvestmentAccount;
        message?: string;
    }>(
        `${environment.apiUrl}/Investment/account`
    );
}
depositToInvestment(request:{
    sourceAccountId: number;
    amount: number; 
}){
    return this.http.post<{
        isSuccess: boolean;
        data: InvestmentAccount;
        message?: string;
    }>(
        `${environment.apiUrl}/Investment/deposit`,
        request
    );
}
getPortfolio() {
  return this.http.get<{
    isSuccess: boolean;
    data: Portfolio;
    message?: string;
  }>(
    `${environment.apiUrl}/Investment/portfolio`
  );
}
buyStock(request: {
  symbol: string;
  quantity: number;
}) {
  return this.http.post<{
    isSuccess: boolean;
    data: {
      investmentAccountId: number;
      symbol: string;
      boughtQuantity: number;
      price: number;
      totalAmount: number;
      newCashBalance: number;
      portfolioQuantity: number;
      averageCost: number;
      message: string;
    };
    message?: string;
  }>(
    `${environment.apiUrl}/Investment/buy`,
    request
  );
}
}