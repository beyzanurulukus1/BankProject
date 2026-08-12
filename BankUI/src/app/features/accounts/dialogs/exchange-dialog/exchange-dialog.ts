import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { forkJoin } from 'rxjs';

import { AccountService } from '../../../../core/services/account';

import {
  ExchangeRateService,
  ExchangeRate
} from '../../../../core/services/exchange-rate';

import { AccountResponse } from '../../../../core/models/account-response';

@Component({
  selector: 'app-exchange-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './exchange-dialog.html',
  styleUrl: './exchange-dialog.css'
})
export class ExchangeDialog implements OnInit {

  private fb = inject(FormBuilder);
  private accountService = inject(AccountService);
  private exchangeRateService = inject(ExchangeRateService);

  exchangeForm: FormGroup;

  accounts: AccountResponse[] = [];
  targetAccounts: AccountResponse[] = [];
  exchangeRates: ExchangeRate[] = [];

  selectedRate: ExchangeRate | null = null;
  convertedAmount: number | null = null;

  rateType: 'BUYING' | 'SELLING' | null = null;

  isLoading = true;
  isSubmitting = false;

  loadError = '';
    private cdr = inject(ChangeDetectorRef);
  constructor(
    private dialogRef: MatDialogRef<ExchangeDialog>,
    @Inject(MAT_DIALOG_DATA)
    public sourceAccount: AccountResponse
  ) {
    this.exchangeForm = this.fb.group({
      targetAccountId: ['', Validators.required],

      amount: [
        '',
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ],

      description: ['Döviz Dönüşümü']
    });
  }

  ngOnInit(): void {
    console.log('💱 ExchangeDialog başladı');
    console.log('💰 Kaynak hesap:', this.sourceAccount);

    this.loadData();
  }

loadData(): void {

  this.isLoading = true;
  this.loadError = '';

  forkJoin({
    accounts: this.accountService.getMyAccounts(),
    rates: this.exchangeRateService.getRates()
  }).subscribe({

    next: (response) => {

      console.log('✅ Exchange hesapları:', response.accounts);
      console.log('✅ Exchange kurları:', response.rates);

      this.accounts = response.accounts.data;

      this.targetAccounts = this.accounts.filter(
        account =>
          account.accountId !== this.sourceAccount.accountId &&
          account.status === 'ACTIVE' &&
          account.currencyCode !== this.sourceAccount.currencyCode
      );

      this.exchangeRates = response.rates.data;

      console.log('🎯 Hedef hesaplar:', this.targetAccounts);
      console.log('💱 Kurlar:', this.exchangeRates);

      this.isLoading = false;

      this.cdr.detectChanges();

      this.updateCalculation();

      this.cdr.detectChanges();
    },

    error: (err) => {

      console.error('❌ ExchangeDialog veri hatası:', err);

      this.loadError =
        err?.error?.message ||
        'Hesap veya kur bilgileri alınamadı.';

      this.isLoading = false;

      this.cdr.detectChanges();
    }

  });
}

  onTargetAccountChange(): void {
    this.updateCalculation();
  }

  onAmountChange(): void {
    this.updateCalculation();
  }

  updateCalculation(): void {

    const targetAccountId = Number(
      this.exchangeForm.get('targetAccountId')?.value
    );

    const amount = Number(
      this.exchangeForm.get('amount')?.value
    );

    if (!targetAccountId || !amount || amount <= 0) {

      this.selectedRate = null;
      this.convertedAmount = null;
      this.rateType = null;

      return;
    }

    const targetAccount = this.targetAccounts.find(
      account => account.accountId === targetAccountId
    );

    if (!targetAccount) {

      this.selectedRate = null;
      this.convertedAmount = null;
      this.rateType = null;

      return;
    }

    this.selectedRate = this.findRate(
      this.sourceAccount.currencyCode,
      targetAccount.currencyCode
    );

    if (!this.selectedRate) {

      this.convertedAmount = null;
      this.rateType = null;

      return;
    }

    // TRY -> USD / EUR
    // Banka dövizi satıyor -> SATIŞ KURU
    if (
      this.sourceAccount.currencyCode === 'TRY' &&
      targetAccount.currencyCode !== 'TRY'
    ) {

      this.rateType = 'SELLING';

      this.convertedAmount =
        amount / this.selectedRate.sellingRate;

      return;
    }

    // USD / EUR -> TRY
    // Banka dövizi alıyor -> ALIŞ KURU
    if (
      this.sourceAccount.currencyCode !== 'TRY' &&
      targetAccount.currencyCode === 'TRY'
    ) {

      this.rateType = 'BUYING';

      this.convertedAmount =
        amount * this.selectedRate.buyingRate;

      return;
    }

    this.convertedAmount = null;
    this.rateType = null;
  }

  findRate(
    sourceCurrency: string,
    targetCurrency: string
  ): ExchangeRate | null {

    // USD -> TRY
    // EUR -> TRY
    if (targetCurrency === 'TRY') {

      return this.exchangeRates.find(
        rate =>
          rate.fromCurrency === sourceCurrency &&
          rate.toCurrency === 'TRY'
      ) ?? null;
    }

    // TRY -> USD
    // TRY -> EUR
    if (sourceCurrency === 'TRY') {

      return this.exchangeRates.find(
        rate =>
          rate.fromCurrency === targetCurrency &&
          rate.toCurrency === 'TRY'
      ) ?? null;
    }

    return null;
  }

  getTargetCurrency(): string {

    const targetId = Number(
      this.exchangeForm.get('targetAccountId')?.value
    );

    return this.targetAccounts.find(
      account => account.accountId === targetId
    )?.currencyCode ?? '';
  }

  getCurrentRate(): number | null {

    if (!this.selectedRate || !this.rateType) {
      return null;
    }

    return this.rateType === 'BUYING'
      ? this.selectedRate.buyingRate
      : this.selectedRate.sellingRate;
  }

  submit(): void {

    if (
      this.exchangeForm.invalid ||
      this.isSubmitting ||
      !this.convertedAmount ||
      this.convertedAmount <= 0
    ) {

      this.exchangeForm.markAllAsTouched();
      return;
    }

    const targetAccountId = Number(
      this.exchangeForm.get('targetAccountId')?.value
    );

    const amount = Number(
      this.exchangeForm.get('amount')?.value
    );

    const description =
      this.exchangeForm.get('description')?.value ||
      'Döviz Dönüşümü';

    this.isSubmitting = true;

    this.accountService.exchange({
      sourceAccountId: this.sourceAccount.accountId,
      targetAccountId: targetAccountId,
      amount: amount,
      description: description
    }).subscribe({

      next: (response: any) => {

        console.log(
          '✅ DÖVİZ DÖNÜŞÜMÜ BAŞARILI',
          response
        );

        alert(
          `${amount.toFixed(2)} ${this.sourceAccount.currencyCode} başarıyla dönüştürüldü.`
        );

        this.dialogRef.close(true);
      },

      error: (err) => {

        console.error(
          '❌ DÖVİZ DÖNÜŞÜMÜ HATASI',
          err
        );

        alert(
          err?.error?.message ||
          'Döviz dönüşümü gerçekleştirilemedi.'
        );

        this.isSubmitting = false;
      }

    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
}