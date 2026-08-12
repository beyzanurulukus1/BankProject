import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AccountService } from '../../../core/services/account';

@Component({
  selector: 'app-withdraw',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './withdraw.html',
  styleUrl: './withdraw.css'
})
export class WithdrawComponent implements OnInit {

  private accountService = inject(AccountService);
  private route = inject(ActivatedRoute);

  accountId = 0;
  amount = 0;
  description = '';

  message = '';
  isSuccess = false;

  ngOnInit(): void {
    this.accountId = Number(
      this.route.snapshot.queryParamMap.get('accountId')
    );
  }

  withdraw() {
    this.accountService.withdraw({
      accountId: this.accountId,
      amount: this.amount,
      description: this.description
    }).subscribe({
      next: (res: any) => {
        this.isSuccess = true;
        this.message = res.message;
      },
      error: (err) => {
        this.isSuccess = false;
        this.message =
          err.error?.message ?? 'Para çekme işlemi başarısız.';
      }
    });
  }
}