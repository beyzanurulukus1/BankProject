import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { AccountService } from '../../../core/services/account';
import {
  InvestmentAccount,
  InvestmentService
} from '../../../core/services/investment';

import { AccountResponse } from '../../../core/models/account-response';

@Component({
  selector: 'app-deposit-investment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule
  ],
  templateUrl: './deposit-investment-dialog.html',
  styleUrl: './deposit-investment-dialog.css'
})
export class DepositInvestmentDialog implements OnInit {

  private accountService = inject(AccountService);
  private investmentService = inject(InvestmentService);
  private cdr = inject(ChangeDetectorRef);

  accounts: AccountResponse[] = [];

  loading = true;
  submitting = false;

  errorMessage = '';

  form = inject(FormBuilder).group({
    sourceAccountId: [null as number | null, Validators.required],
    amount: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01)
      ]
    ]
  });

  constructor(
    private dialogRef: MatDialogRef<DepositInvestmentDialog>,

    @Inject(MAT_DIALOG_DATA)
    public investmentAccount: InvestmentAccount
  ) {}

  ngOnInit(): void {
    this.loadAccounts();

    this.form
      .get('sourceAccountId')
      ?.valueChanges
      .subscribe(() => {
        this.cdr.detectChanges();
      });

    this.form
      .get('amount')
      ?.valueChanges
      .subscribe(() => {
        this.cdr.detectChanges();
      });
  }

  loadAccounts(): void {

    this.accountService
      .getMyAccounts()
      .subscribe({

        next: (response) => {

          this.accounts = response.data.filter(
            account =>
              account.status === 'ACTIVE' &&
              account.currencyCode === 'TRY'
          );

          this.loading = false;

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error(
            '❌ Hesaplar alınamadı:',
            err
          );

          this.loading = false;

          this.errorMessage =
            'Hesaplarınız alınamadı.';

          this.cdr.detectChanges();
        }

      });
  }

  get selectedAccount(): AccountResponse | null {

    const accountId =
      this.form.get('sourceAccountId')?.value;

    if (!accountId) {
      return null;
    }

    return (
      this.accounts.find(
        account => account.accountId === accountId
      ) ?? null
    );
  }

  get amount(): number {

    return Number(
      this.form.get('amount')?.value ?? 0
    );
  }

  get resultingBalance(): number {

    return (
      Number(this.investmentAccount.cashBalance) +
      this.amount
    );
  }

  canTransfer(): boolean {

    const account = this.selectedAccount;

    if (!account) {
      return false;
    }

    if (this.form.invalid) {
      return false;
    }

    return this.amount <= Number(account.balance);
  }

  submit(): void {

    if (!this.canTransfer()) {
      this.form.markAllAsTouched();
      return;
    }

    const account =
      this.selectedAccount;

    if (!account) {
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.investmentService
      .depositToInvestment({
        sourceAccountId: account.accountId,
        amount: this.amount
      })
      .subscribe({

        next: (response) => {

          console.log(
            '✅ Yatırım hesabına para aktarıldı:',
            response
          );

          this.dialogRef.close(
            response.data
          );
        },

        error: (err) => {

          console.error(
            '❌ Para aktarımı başarısız:',
            err
          );

          this.submitting = false;

          this.errorMessage =
            err?.error?.message ??
            'Para aktarımı gerçekleştirilemedi.';

          this.cdr.detectChanges();
        }

      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

}