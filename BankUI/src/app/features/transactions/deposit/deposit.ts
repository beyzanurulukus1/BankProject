import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AccountService } from '../../../core/services/account';

@Component({
  selector: 'app-deposit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './deposit.html',
  styleUrl: './deposit.css'
})
export class DepositComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private router = inject(Router);

  accountId = 0;
  amount = 0;
  description = '';

  ngOnInit(): void {
    this.accountId = Number(
      this.route.snapshot.queryParamMap.get('accountId')
    );
  }

  deposit() {
    this.accountService.deposit({
      accountId: this.accountId,
      amount: this.amount,
      description: this.description
    }).subscribe({
      next: () => {
        alert('Para yatırıldı.');
        this.router.navigate(['/accounts']);
      },
error: err => {

  console.log("HATA:");
  console.log(err);
  console.log(err.error);

  alert(JSON.stringify(err.error));

}
    });
  }
}