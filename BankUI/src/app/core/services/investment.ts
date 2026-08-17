import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';


// =========================
// STOCK
// =========================

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


// =========================
// MARKET INDEX
// =========================

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


// =========================
// HISTORICAL PRICE
// =========================

export interface HistoricalPrice {
  date: string;

  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;

  volume: number | null;
}


// =========================
// INVESTMENT ACCOUNT
// =========================

export interface InvestmentAccount {
  id: number;

  userId: number;

  cashBalance: number;

  createdAt: string;
}


// =========================
// PORTFOLIO POSITION
// =========================

export interface PortfolioPosition {

  symbol: string;

  quantity: number;

  averageCost: number;

  currentPrice: number;

  totalCost: number;

  currentValue: number;

  profitLoss: number;

  profitLossPercent: number;
}


// =========================
// PORTFOLIO
// =========================

export interface Portfolio {

  investmentAccountId: number;

  cashBalance: number;

  totalCost: number;

  totalValue: number;

  totalProfitLoss: number;

  totalProfitLossPercent: number;

  positions: PortfolioPosition[];
}


// =========================
// BUY RESULT
// =========================

export interface InvestmentBuyResult {

  investmentAccountId: number;

  symbol: string;

  boughtQuantity: number;

  price: number;

  totalAmount: number;

  newCashBalance: number;

  portfolioQuantity: number;

  averageCost: number;

  message: string;
}


// =========================
// SELL RESULT
// =========================

export interface InvestmentSellResult {

  investmentAccountId: number;

  symbol: string;

  soldQuantity: number;

  price: number;

  totalAmount: number;

  realizedProfitLoss: number;

  newCashBalance: number;

  remainingQuantity: number;

  averageCost: number;

  message: string;
}
export interface InvestmentTransaction {
  id: number;
  symbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  realizedProfitLoss: number | null;
  createdAt: string;
}

export interface InvestmentTransactionSummary {
  totalRealizedProfitLoss: number;
  transactions: InvestmentTransaction[];
}


// =========================
// SERVICE
// =========================

@Injectable({
  providedIn: 'root'
})
export class InvestmentService {

  private http = inject(HttpClient);


  // =========================
  // STOCK
  // =========================

  getStock(symbol: string) {

    return this.http.get<{
      isSuccess: boolean;
      data: Stock;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/stock/${symbol}`
    );

  }


  // =========================
  // MARKET INDEX
  // =========================

  getIndex(symbol: string) {

    return this.http.get<{
      isSuccess: boolean;
      data: MarketIndex;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/index/${symbol}`
    );

  }


  // =========================
  // HISTORICAL DATA
  // =========================

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


  // =========================
  // INVESTMENT ACCOUNT
  // =========================

  getInvestmentAccount() {

    return this.http.get<{
      isSuccess: boolean;
      data: InvestmentAccount;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/account`
    );

  }


  // =========================
  // DEPOSIT TO INVESTMENT
  // =========================

  depositToInvestment(request: {
    sourceAccountId: number;
    amount: number;
  }) {

    return this.http.post<{
      isSuccess: boolean;
      data: InvestmentAccount;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/deposit`,
      request
    );

  }


  // =========================
  // PORTFOLIO
  // =========================

  getPortfolio() {

    return this.http.get<{
      isSuccess: boolean;
      data: Portfolio;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/portfolio`
    );

  }


  // =========================
  // BUY STOCK
  // =========================

  buyStock(request: {
    symbol: string;
    quantity: number;
  }) {

    return this.http.post<{
      isSuccess: boolean;
      data: InvestmentBuyResult;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/buy`,
      request
    );

  }


  // =========================
  // SELL STOCK
  // =========================

  sellStock(request: {
    symbol: string;
    quantity: number;
  }) {

    return this.http.post<{
      isSuccess: boolean;
      data: InvestmentSellResult;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/sell`,
      request
    );

  }
  getInvestmentTransactions(){
    return this.http.get<{
      isSuccess: boolean;
      data: InvestmentTransactionSummary;
      message?: string;
    }>(
      `${environment.apiUrl}/Investment/transactions`
    );
  }

}