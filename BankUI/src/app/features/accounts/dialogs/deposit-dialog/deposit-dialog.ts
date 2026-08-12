import { Component, Inject, inject } from '@angular/core';
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
  selector: 'app-deposit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './deposit-dialog.html',
  styleUrl: './deposit-dialog.css'
})
export class DepositDialog {

  amount = 0;
  description = '';

  private accountService = inject(AccountService);

  private dialogRef = inject(
    MatDialogRef<DepositDialog>
  );

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public account: AccountResponse
  ) {}

  deposit() {

    if (this.amount <= 0) {
      return;
    }

    this.accountService.deposit({
      accountId: this.account.accountId,
      amount: this.amount,
      description: this.description
    }).subscribe({

      next: (response) => {

        console.log('Para yatırma başarılı:', response);

        this.dialogRef.close(true);

      },

      error: (err) => {

        console.log('Para yatırma hatası:', err);

        alert(
          err?.error?.message ??
          'Para yatırma işlemi başarısız.'
        );

      }

    });

  }

  close() {
    this.dialogRef.close(false);
  }
}