export interface TransactionHistory {
  transactionId: number;
  referenceNo: string;
  sourceIban: string | null;
  targetIban: string | null;
  amount: number;
  currencyCode: string;
  currencySymbol: string;
  transactionType: string;
  description: string | null;
  status: string;
  transactionTime: string;
  isOutgoing: boolean;
}