export interface DashboardResponse {

    customerName: string;

    balances: CurrencyBalance[];

    accountCount: number;

    activeAccountCount: number;

    recentTransactions: any[];
}


export interface CurrencyBalance {

    currencyCode: string;

    balance: number;

    currencySymbol: string;
}