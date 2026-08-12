import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';

import { DepositDialog } from '../deposit-dialog/deposit-dialog';
import { WithdrawDialog } from '../withdraw-dialog/withdraw-dialog';
import { TransferDialog } from '../transfer-dialog/transfer-dialog';
import { ExchangeDialog } from '../exchange-dialog/exchange-dialog';

@Component({
  selector: 'app-operations-dialog',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './operations-dialog.html',
  styleUrl: './operations-dialog.css'
})
export class OperationsDialog {

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<OperationsDialog>,
    @Inject(MAT_DIALOG_DATA) public account: any
  ) {}

  openDeposit(): void {
    this.dialogRef.close();

    this.dialog.open(DepositDialog, {
      width: '480px',
      data: this.account
    });
  }

  openWithdraw(): void {
    this.dialogRef.close();

    this.dialog.open(WithdrawDialog, {
      width: '480px',
      data: this.account
    });
  }

  openTransfer(): void {
    this.dialogRef.close();

    this.dialog.open(TransferDialog, {
      width: '480px',
      data: this.account
    });
  }

  openExchange(): void {
    console.log('💱 ExchangeDialog açılıyor');
    this.dialogRef.close();

    this.dialog.open(ExchangeDialog, {
      width: '520px',
      data: this.account
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}