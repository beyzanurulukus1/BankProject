import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AccountService } from '../../../core/services/account';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './transfer.html',
  styleUrl: './transfer.css'
})
export class TransferComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private router = inject(Router);

  sourceAccountId = 0;

  targetIban = '';

  amount = 0;

  description = '';

  ngOnInit(): void {

    this.sourceAccountId = Number(
      this.route.snapshot.queryParamMap.get('accountId')
    );

  }

  transfer() {

    this.accountService.transfer({

      sourceAccountId: this.sourceAccountId,

      targetIban: this.targetIban,

      amount: this.amount,

      description: this.description

    }).subscribe({

      next: () => {

        alert('Transfer başarılı');

        this.router.navigate(['/accounts']);

      },

      error: err => {

        console.error(err);

        alert(err.error?.message ?? 'Transfer başarısız');

      }

    });

  }

}