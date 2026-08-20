import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AccountService } from '../../core/services/account';
import { AccountResponse } from '../../core/models/account-response';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateAccountDialog } from './create-account-dialog/create-account-dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { EditNicknameDialog } from './edit-nickname-dialog/edit-nickname-dialog';
import { DepositDialog } from './dialogs/deposit-dialog/deposit-dialog';
import { OperationsDialog } from './dialogs/operations-dialog/operations-dialog';
import { WithdrawDialog } from './dialogs/withdraw-dialog/withdraw-dialog';
@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule,
            MatDialogModule,
          MatMenuModule,
        MatIconModule,
      MatButtonModule],
  templateUrl: './accounts.html',
  styleUrl: './accounts.css'
})

export class AccountsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private accountService = inject(AccountService);
  private dialog = inject(MatDialog);
  accounts: AccountResponse[] = [];
openCreateAccountDialog() {

  const dialogRef = this.dialog.open(CreateAccountDialog, {
    width: '420px'
  });

  dialogRef.afterClosed().subscribe(result => {

    console.log("Dialog sonucu:", result);

    if (!result) {
      console.log("Dialog iptal edildi");
      return;
    }

    console.log("API'ye gönderiliyor");

    this.accountService.createAccount(result).subscribe({

      next: (res) => {

        console.log("BAŞARILI", res);

        this.loadAccounts();

      },

      error: (err) => {

        console.log("API HATASI", err);

      }

    });

  });

}
  ngOnInit(): void {

    this.loadAccounts();
    
  }
  constructor(
    private router: Router
  ) {}

loadAccounts() {

  this.accountService.getMyAccounts().subscribe({

    next: (response) => {

      console.log("HESAPLAR GELDİ");
      console.log(response);

      this.accounts = response.data;

      console.log(
        "🔎 HESAP STATUS KONTROLÜ:",
        this.accounts.map(account => ({
          accountId: account.accountId,
          nickname: account.nickname,
          status: account.status,
          statusLength: account.status?.length
        }))
      );

      this.cdr.detectChanges();
    },

    error: (err) => {

      console.log("HESAPLAR GETİRİLEMEDİ");
      console.log(err);

      this.cdr.detectChanges();
    }

  });

}
  goToDeposit(accountId: number) {

    this.router.navigate(['/deposit'], {
      queryParams: { accountId }
    });
  
  }
  
  goToWithdraw(accountId: number) {
  
    this.router.navigate(['/withdraw'], {
      queryParams: { accountId }
    });
  
  }
  
  goToTransfer(accountId: number) {
  
    this.router.navigate(['/transfer'], {
      queryParams: { accountId }
    });
  
  }
  
  goToHistory(accountId: number) {
  
    this.router.navigate(['/history'], {
      queryParams: { accountId }
    });
  
  }
  
  copyIban(iban: string) {
  
    navigator.clipboard.writeText(iban);
  
    alert("IBAN panoya kopyalandı.");
  
  }
  editNickname(account: AccountResponse) {

    const dialogRef = this.dialog.open(EditNicknameDialog, {
      width: '400px',
      data: {
        accountId: account.accountId,
        nickname: account.nickname
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
  
      if (!result) return;
  
      this.accountService.updateNickname(result).subscribe({
  
        next: () => {
  
          alert("Takma ad güncellendi.");
  
          this.loadAccounts();
  
        },
  
        error: err => {
  
          console.log(err);
  
        }
  
      });
  
    });
  
  }
  
  deactivateAccount(accountId: number) {

    const confirmed = confirm(
      "Bu hesabı pasifleştirmek istediğinize emin misiniz?"
    );
  
    if (!confirmed) return;
  
    this.accountService
      .deactivateAccount(accountId)
      .subscribe({
  
        next: () => {
  
          alert("Hesap pasifleştirildi.");
  
          this.loadAccounts();
  
        },
  
        error: err => {
  
          console.log(err);
  
        }
  
      });
  
  }
  activateAccount(accountId: number) {

  const confirmed = confirm(
    "Bu hesabı aktifleştirmek istediğinize emin misiniz?"
  );

  if (!confirmed) return;

  this.accountService
    .activateAccount(accountId)
    .subscribe({

      next: () => {

        alert("Hesap aktifleştirildi.");

        this.loadAccounts();

      },

      error: err => {

        console.log(err);

      }

    });

}
  openDepositDialog(account: AccountResponse) {

  const dialogRef = this.dialog.open(DepositDialog, {
    width: '480px',
    data: account
  });

  dialogRef.afterClosed().subscribe(result => {

    if (result) {
      this.loadAccounts();
    }

  });

}
openOperationsDialog(account: AccountResponse) {

  const dialogRef = this.dialog.open(OperationsDialog, {
    width: '380px',
    data: account
  });

  dialogRef.afterClosed().subscribe(() => {
    this.loadAccounts();
  });

}
openWithdrawDialog(account: AccountResponse) {

  const dialogRef = this.dialog.open(WithdrawDialog, {
    width: '480px',
    data: account
  });

  dialogRef.afterClosed().subscribe(result => {

    if (result) {
      this.loadAccounts();
    }

  });

}
  }