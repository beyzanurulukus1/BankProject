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
  private cdr = inject(ChangeDetectorRef);

  exchangeForm: FormGroup;

  accounts: AccountResponse[] = [];
  targetAccounts: AccountResponse[] = [];
  exchangeRates: ExchangeRate[] = [];

  selectedRate: ExchangeRate | null = null;
  convertedAmount: number | null = null;

  rateType: 'BUYING' | 'SELLING' | 'CROSS' | null = null;

  isLoading = true;
  isSubmitting = false;

  loadError = '';

  constructor(
    private dialogRef: MatDialogRef<ExchangeDialog>,

    @Inject(MAT_DIALOG_DATA)
    public sourceAccount: AccountResponse
  ) {

    this.exchangeForm = this.fb.group({

      targetAccountId: [
        '',
        Validators.required
      ],

      amount: [
        '',
        [
          Validators.required,
          Validators.min(0.01)
        ]
      ],

      description: [
        'Döviz Dönüşümü'
      ]

    });
  }

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    console.log('================================');
    console.log('💱 EXCHANGE DIALOG BAŞLADI');
    console.log('================================');

    console.log('💰 Kaynak hesap:', this.sourceAccount);

    this.loadData();
  }

  // ============================================================
  // VERİLERİ YÜKLE
  // ============================================================

  loadData(): void {

    this.isLoading = true;
    this.loadError = '';

    this.accountService.getMyAccounts().subscribe({

      next: (accountsResponse) => {

        console.log('✅ HESAPLAR GELDİ:', accountsResponse);

        this.accounts =
          accountsResponse.data ?? [];

        // --------------------------------------------------------
        // Hedef hesapları belirle
        // --------------------------------------------------------

        this.targetAccounts =
          this.accounts.filter(account =>

            account.accountId !==
              this.sourceAccount.accountId &&

            account.status === 'ACTIVE' &&

            account.currencyCode !==
              this.sourceAccount.currencyCode

          );

        console.log(
          '🎯 HEDEF HESAPLAR:',
          this.targetAccounts
        );

        // --------------------------------------------------------
        // KURLARI GETİR
        // --------------------------------------------------------

        this.exchangeRateService.getRates().subscribe({

          next: (ratesResponse) => {

            console.log(
              '✅ KURLAR GELDİ:',
              ratesResponse
            );

            this.exchangeRates =
              ratesResponse.data ?? [];

            console.log(
              '💱 EXCHANGE RATES:',
              this.exchangeRates
            );

            this.isLoading = false;

            this.cdr.detectChanges();

          },

          error: (err) => {

            console.error(
              '❌ KUR API HATASI:',
              err
            );

            this.loadError =
              err?.error?.message ||
              'Döviz kurları alınamadı.';

            this.isLoading = false;

            this.cdr.detectChanges();
          }

        });
      },

      error: (err) => {

        console.error(
          '❌ HESAP API HATASI:',
          err
        );

        this.loadError =
          err?.error?.message ||
          'Hesap bilgileri alınamadı.';

        this.isLoading = false;

        this.cdr.detectChanges();
      }

    });
  }

  // ============================================================
  // HEDEF HESAP DEĞİŞTİ
  // ============================================================

  onTargetAccountChange(): void {

    console.log(
      '🎯 Hedef hesap değişti:',
      this.exchangeForm.get('targetAccountId')?.value
    );

    this.updateCalculation();
  }

  // ============================================================
  // TUTAR DEĞİŞTİ
  // ============================================================

  onAmountChange(): void {

    console.log(
      '💰 Tutar değişti:',
      this.exchangeForm.get('amount')?.value
    );

    this.updateCalculation();
  }

  // ============================================================
  // HESAPLAMA
  // ============================================================

  updateCalculation(): void {

    const targetAccountId =
      Number(
        this.exchangeForm
          .get('targetAccountId')
          ?.value
      );

    const amount =
      Number(
        this.exchangeForm
          .get('amount')
          ?.value
      );

    console.log('================================');
    console.log('💱 EXCHANGE CALCULATION');
    console.log('================================');

    console.log(
      'Kaynak:',
      this.sourceAccount.currencyCode
    );

    console.log(
      'Hedef Account ID:',
      targetAccountId
    );

    console.log(
      'Tutar:',
      amount
    );

    // --------------------------------------------------------
    // Hedef veya tutar yok
    // --------------------------------------------------------

    if (
      !targetAccountId ||
      !amount ||
      amount <= 0
    ) {

      this.selectedRate = null;
      this.convertedAmount = null;
      this.rateType = null;

      console.log(
        '⛔ Hedef hesap veya tutar yok.'
      );

      this.cdr.detectChanges();

      return;
    }

    // --------------------------------------------------------
    // Hedef hesabı bul
    // --------------------------------------------------------

    const targetAccount =
      this.targetAccounts.find(
        account =>
          account.accountId ===
          targetAccountId
      );

    console.log(
      '🎯 Bulunan hedef hesap:',
      targetAccount
    );

    if (!targetAccount) {

      this.selectedRate = null;
      this.convertedAmount = null;
      this.rateType = null;

      console.log(
        '❌ Hedef hesap bulunamadı.'
      );

      return;
    }

    const sourceCurrency =
      this.sourceAccount.currencyCode;

    const targetCurrency =
      targetAccount.currencyCode;

    console.log(
      '💰 Kaynak para:',
      sourceCurrency
    );

    console.log(
      '💰 Hedef para:',
      targetCurrency
    );

    // --------------------------------------------------------
    // KURU BUL
    // --------------------------------------------------------

    const rate =
      this.findRate(
        sourceCurrency,
        targetCurrency
      );

    console.log(
      '💱 Bulunan kur:',
      rate
    );

    if (!rate) {

      this.selectedRate = null;
      this.convertedAmount = null;
      this.rateType = null;

      console.log(
        '❌ Bu dönüşüm için kur bulunamadı.'
      );

      this.cdr.detectChanges();

      return;
    }

    this.selectedRate = rate;

    // ========================================================
    // TRY -> USD / EUR
    // ========================================================

if (
  sourceCurrency === 'TRY' &&
  targetCurrency !== 'TRY'
) {

  this.rateType = 'SELLING';

  const exchangeRate =
    rate.rate;

  this.convertedAmount =
    Number(
      (
        amount *
        exchangeRate
      ).toFixed(2)
    );

console.log('--------------------------------');
  console.log('🏦 TRY -> DÖVİZ');
  console.log(
    'Kur tipi:',
    'SELLING'
  );

  console.log(
    'Dönüşüm kuru:',
    exchangeRate
  );

  console.log(
    'Kaynak tutar:',
    amount,
    sourceCurrency
  );

  console.log(
    'Alınacak:',
    this.convertedAmount,
    targetCurrency
  );

  console.log('--------------------------------');

  this.cdr.detectChanges();

  return;
}

    // ========================================================
    // USD / EUR -> TRY
    // ========================================================

    if (
      sourceCurrency !== 'TRY' &&
      targetCurrency === 'TRY'
    ) {

      this.rateType = 'BUYING';

const exchangeRate =
  rate.rate;

this.convertedAmount =
  Number(
    (
      amount *
      exchangeRate
    ).toFixed(2)
  );
      console.log('--------------------------------');
      console.log('🏦 DÖVİZ -> TRY');
      console.log(
        'Kur tipi:',
        'BUYING'
      );

      console.log(
        'Alış kuru:',
        exchangeRate
      );

      console.log(
        'Kaynak tutar:',
        amount,
        sourceCurrency
      );

      console.log(
        'Alınacak:',
        this.convertedAmount,
        targetCurrency
      );

      console.log('--------------------------------');

      this.cdr.detectChanges();

      return;
    }

    // ========================================================
    // USD -> EUR
    // EUR -> USD
    // ========================================================

    if (
      sourceCurrency !== 'TRY' &&
      targetCurrency !== 'TRY'
    ) {

      this.rateType = 'CROSS';

      /*
        DB'deki cross rate doğrudan dönüşüm oranıdır.

        Örneğin:

        USD -> EUR

        USD buying / EUR selling

        sonucu DB'ye USD -> EUR olarak yazılmıştır.

        Bu yüzden:

        amount * rate
      */

      const crossRate =
        rate.rate;

      this.convertedAmount =
        Number(
          (
            amount *
            crossRate
          ).toFixed(2)
        );

      console.log('--------------------------------');
      console.log('🏦 DÖVİZ -> DÖVİZ');
      console.log(
        'Kur tipi:',
        'CROSS'
      );

      console.log(
        'Cross rate:',
        crossRate
      );

      console.log(
        'Kaynak tutar:',
        amount,
        sourceCurrency
      );

      console.log(
        'Alınacak:',
        this.convertedAmount,
        targetCurrency
      );

      console.log('--------------------------------');

      this.cdr.detectChanges();

      return;
    }

    // --------------------------------------------------------
    // Desteklenmeyen
    // --------------------------------------------------------

    this.selectedRate = null;
    this.convertedAmount = null;
    this.rateType = null;

    console.log(
      '❌ Desteklenmeyen para birimi dönüşümü.'
    );

    this.cdr.detectChanges();
  }

  // ============================================================
  // KUR BUL
  // ============================================================

  findRate(
    sourceCurrency: string,
    targetCurrency: string
  ): ExchangeRate | null {

    console.log('================================');
    console.log('🔎 KUR ARANIYOR');
    console.log({
      sourceCurrency,
      targetCurrency
    });

    console.log(
      'Mevcut kurlar:',
      this.exchangeRates
    );

    // --------------------------------------------------------
    // Aynı para birimi
    // --------------------------------------------------------

    if (
      sourceCurrency ===
      targetCurrency
    ) {

      console.log(
        '⛔ Aynı para birimi.'
      );

      return null;
    }

    // --------------------------------------------------------
    // 1. DOĞRUDAN KUR
    //
    // USD -> EUR
    // EUR -> USD
    // USD -> TRY
    // EUR -> TRY
    // TRY -> USD
    // TRY -> EUR
    // --------------------------------------------------------

    const directRate =
      this.exchangeRates.find(rate =>

        rate.fromCurrency
          .trim()
          .toUpperCase() ===
          sourceCurrency
            .trim()
            .toUpperCase()

        &&

        rate.toCurrency
          .trim()
          .toUpperCase() ===
          targetCurrency
            .trim()
            .toUpperCase()

      );

    if (directRate) {

      console.log(
        '✅ DOĞRUDAN KUR BULUNDU:',
        directRate
      );

      return directRate;
    }

    // --------------------------------------------------------
    // Eğer burada geliyorsa DB'de o yön yok.
    // --------------------------------------------------------

    console.log(
      '❌ DOĞRUDAN KUR YOK:',
      `${sourceCurrency} -> ${targetCurrency}`
    );

    return null;
  }

  // ============================================================
  // HEDEF PARA BİRİMİ
  // ============================================================

  getTargetCurrency(): string {

    const targetId =
      Number(
        this.exchangeForm
          .get('targetAccountId')
          ?.value
      );

    return (
      this.targetAccounts.find(
        account =>
          account.accountId ===
          targetId
      )?.currencyCode ?? ''
    );
  }

  // ============================================================
  // GÖSTERİLECEK KUR
  // ============================================================

  getCurrentRate(): number | null {

    if (
      !this.selectedRate ||
      !this.rateType
    ) {
      return null;
    }

    if (
      this.rateType === 'BUYING'
    ) {

      return this.selectedRate.buyingRate;
    }

    if (
      this.rateType === 'SELLING'
    ) {

      return this.selectedRate.sellingRate;
    }

    // CROSS
    return this.selectedRate.rate;
  }

  // ============================================================
  // SUBMIT
  // ============================================================

  submit(): void {

    console.log('================================');
    console.log('🟢 SUBMIT ÇAĞRILDI');
    console.log('================================');

    console.log({
      formValid:
        this.exchangeForm.valid,

      formValue:
        this.exchangeForm.value,

      convertedAmount:
        this.convertedAmount,

      isSubmitting:
        this.isSubmitting,

      selectedRate:
        this.selectedRate,

      rateType:
        this.rateType
    });

    // --------------------------------------------------------
    // Validation
    // --------------------------------------------------------

    if (
      this.exchangeForm.invalid ||
      this.isSubmitting ||
      !this.convertedAmount ||
      this.convertedAmount <= 0
    ) {

      console.log(
        '⛔ SUBMIT ENGELLENDİ'
      );

      this.exchangeForm.markAllAsTouched();

      return;
    }

    const targetAccountId =
      Number(
        this.exchangeForm
          .get('targetAccountId')
          ?.value
      );

    const amount =
      Number(
        this.exchangeForm
          .get('amount')
          ?.value
      );

    const description =
      this.exchangeForm
        .get('description')
        ?.value ||
      'Döviz Dönüşümü';

    console.log(
      '📤 BACKEND\'E GÖNDERİLECEK:',
      {
        sourceAccountId:
          this.sourceAccount.accountId,

        targetAccountId,

        amount,

        description
      }
    );

    this.isSubmitting = true;

    this.accountService.exchange({

      sourceAccountId:
        this.sourceAccount.accountId,

      targetAccountId:
        targetAccountId,

      amount:
        amount,

      description:
        description

    }).subscribe({

      next: (response: any) => {

        console.log(
          '================================'
        );

        console.log(
          '✅ DÖVİZ DÖNÜŞÜMÜ BAŞARILI'
        );

        console.log(
          'Backend response:',
          response
        );

        console.log(
          '================================'
        );

        alert(
          `${amount.toFixed(2)} ${
            this.sourceAccount.currencyCode
          } başarıyla ${
            this.getTargetCurrency()
          } hesabına dönüştürüldü.`
        );

        this.dialogRef.close(true);
      },

      error: (err) => {

        console.error(
          '================================'
        );

        console.error(
          '❌ DÖVİZ DÖNÜŞÜMÜ HATASI'
        );

        console.error(
          'HTTP status:',
          err?.status
        );

        console.error(
          'Backend error:',
          err?.error
        );

        console.error(
          '================================'
        );

        alert(
          err?.error?.message ||
          'Döviz dönüşümü gerçekleştirilemedi.'
        );

        this.isSubmitting = false;

        this.cdr.detectChanges();
      }

    });
  }

  // ============================================================
  // CLOSE
  // ============================================================

  close(): void {

    this.dialogRef.close(false);
  }
}