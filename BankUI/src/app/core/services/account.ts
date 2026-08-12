import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AccountResponse } from '../models/account-response';

@Injectable({
  providedIn: 'root',
})
export class AccountService {

  private http = inject(HttpClient);

  getMyAccounts() {
    return this.http.get<{
      isSuccess: boolean;
      data: AccountResponse[];
    }>(
      `${environment.apiUrl}/Account/my-accounts`
    );
  }

  createAccount(request: {
    currencyId: number;
    nickname: string;
  }) {
    return this.http.post(
      `${environment.apiUrl}/Account/create`,
      request
    );
  }

  updateNickname(request: {
    accountId: number;
    nickname: string;
  }) {
    return this.http.put(
      `${environment.apiUrl}/Account/nickname`,
      request
    );
  }

  deactivateAccount(accountId: number) {
    return this.http.put(
      `${environment.apiUrl}/Account/deactivate`,
      {
        accountId
      }
    );
  }

  deposit(request: {
    accountId: number;
    amount: number;
    description: string;
  }) {
    return this.http.post(
      `${environment.apiUrl}/Transaction/deposit`,
      request
    );
  }

  withdraw(request: {
    accountId: number;
    amount: number;
    description: string;
  }) {
    return this.http.post(
      `${environment.apiUrl}/Transaction/withdraw`,
      request
    );
  }
  transfer(request: {
  sourceAccountId: number;
  targetIban: string;
  amount: number;
  description: string;
}) {
  return this.http.post(
    `${environment.apiUrl}/Transaction/transfer`,
    request
  );
}

exchange(request: {
  sourceAccountId: number;
  targetAccountId: number;
  amount: number;
  description: string;
}) {
  return this.http.post(
    `${environment.apiUrl}/Transaction/exchange`,
    request
  );
}
}