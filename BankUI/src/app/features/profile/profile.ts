import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

interface ProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  tckn: string;
  birthDate: string;
  createdAt: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {

  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  profile: ProfileResponse | null = null;

  loading = true;

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {

    this.http
      .get<{
        isSuccess: boolean;
        data: ProfileResponse;
      }>(`${environment.apiUrl}/Profile`)
      .subscribe({

        next: (response) => {

          console.log('✅ PROFİL GELDİ');
          console.log(response);

          this.profile = response.data;

          this.loading = false;

          this.cdr.detectChanges();
        },

        error: (err) => {

          console.error('❌ PROFİL GETİRİLEMEDİ');
          console.error(err);

          this.loading = false;

          this.cdr.detectChanges();
        }

      });
  }

}