import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { DashboardService } from '../../core/services/dashboard';
import { DashboardResponse } from '../../core/models/dashboard-response';

import {
  ExchangeRateService,
  ExchangeRate
} from '../../core/services/exchange-rate';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {

  private cdr = inject(ChangeDetectorRef);

  dashboard: DashboardResponse | null = null;

  exchangeRates: ExchangeRate[] = [];

  loading = true;

  constructor(
    private dashboardService: DashboardService,
    private exchangeRateService: ExchangeRateService
  ) {}

  ngOnInit(): void {

    console.log('✅ DashboardComponent çalıştı');

    this.loadDashboard();
    this.loadExchangeRates();
  }

  loadDashboard(): void {

    console.log('🚀 Dashboard API çağrılıyor...');

    this.dashboardService.getDashboard().subscribe({

      next: (response) => {

        console.log('✅ API CEVABI', response);

        this.dashboard = response.data;

        this.loading = false;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('❌ Dashboard yüklenemedi', err);

        this.loading = false;

        this.cdr.detectChanges();
      }

    });
  }

  loadExchangeRates(): void {

    console.log('💱 Döviz kurları çağrılıyor...');

    this.exchangeRateService.getRates().subscribe({

      next: (response) => {

        console.log('✅ KURLAR', response);

        this.exchangeRates = response.data;

        this.cdr.detectChanges();
      },

      error: (err) => {

        console.error('❌ KUR HATASI', err);

        this.cdr.detectChanges();
      }

    });
  }

  getTransactionName(type: string): string {

    switch (type) {

      case 'DEPOSIT':
        return 'Para Yatırma';

      case 'WITHDRAW':
        return 'Para Çekme';

      case 'TRANSFER':
        return 'Transfer';

      case 'EXCHANGE':
        return 'Döviz Dönüşümü';

      default:
        return type;
    }
  }

}