import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AccountService } from '../../../../core/services/account';
import { AccountResponse } from '../../../../core/models/account-response';

@Component({
  selector: 'app-withdraw-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './withdraw-dialog.html',
  styleUrl: './withdraw-dialog.css'
})
export class WithdrawDialog {

  amount = 0;
  description = '';

  constructor(
    private accountService: AccountService,
    private dialogRef: MatDialogRef<WithdrawDialog>,
    @Inject(MAT_DIALOG_DATA) public account: AccountResponse
  ) {}

  withdraw() {

    if (this.amount <= 0) {
      alert('Lütfen geçerli bir tutar giriniz.');
      return;
    }

    this.accountService.withdraw({
      accountId: this.account.accountId,
      amount: this.amount,
      description: this.description
    }).subscribe({

      next: (response) => {

        console.log('PARA ÇEKME BAŞARILI', response);

        alert('Para başarıyla çekildi.');

        this.dialogRef.close(true);
      },

      error: (err) => {

        console.error('PARA ÇEKME HATASI', err);

        const message =
          err.error?.message || 'Para çekme işlemi başarısız.';

        alert(message);
      }

    });
  }

  close() {
    this.dialogRef.close();
  }
}