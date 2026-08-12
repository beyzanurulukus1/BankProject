import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { AccountService } from '../../../../core/services/account';


@Component({
  selector: 'app-transfer-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './transfer-dialog.html',
  styleUrl: './transfer-dialog.css'
})
export class TransferDialog {

  targetIban = '';
  amount = 0;
  description = '';

  constructor(
    private accountService: AccountService,
    private dialogRef: MatDialogRef<TransferDialog>,
    @Inject(MAT_DIALOG_DATA) public account: any
  ) {}

  transfer() {

    if (!this.targetIban || this.amount <= 0) {
      alert('Lütfen alıcı IBAN ve geçerli bir tutar giriniz.');
      return;
    }

    this.accountService.transfer({
      sourceAccountId: this.account.accountId,
      targetIban: this.targetIban,
      amount: this.amount,
      description: this.description
    }).subscribe({

      next: (response) => {

        console.log('TRANSFER BAŞARILI', response);

        alert('Transfer başarıyla gerçekleştirildi.');

        this.dialogRef.close(true);
      },

      error: (err) => {

        console.error('TRANSFER HATASI', err);

        const message =
          err.error?.message ||
          'Transfer gerçekleştirilemedi.';

        alert(message);
      }

    });

  }

  close() {
    this.dialogRef.close();
  }
}