import { Routes } from '@angular/router';

import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout';

import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';

import { DashboardComponent } from './features/dashboard/dashboard';
import { AccountsComponent } from './features/accounts/accounts';

import { TransferComponent } from './features/transactions/transfer/transfer';
import { DepositComponent } from './features/transactions/deposit/deposit';
import { WithdrawComponent } from './features/transactions/withdraw/withdraw';
import { HistoryComponent } from './features/transactions/history/history';

import { ProfileComponent } from './features/profile/profile';
import { InvestmentComponent } from './features/investment/investment';

export const routes: Routes = [

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'register',
    component: RegisterComponent
  },

  {
    path: '',
    component: DashboardLayoutComponent,
    children: [

      {
        path: 'dashboard',
        component: DashboardComponent
      },

      {
        path: 'accounts',
        component: AccountsComponent
      },

      {
        path: 'transfer',
        component: TransferComponent
      },

      {
        path: 'deposit',
        component: DepositComponent
      },

      {
        path: 'withdraw',
        component: WithdrawComponent
      },

      {
        path: 'history',
        component: HistoryComponent
      },

      {
        path: 'profile',
        component: ProfileComponent
      },
      {
  path: 'investment',
  component: InvestmentComponent
},

    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }
  

];