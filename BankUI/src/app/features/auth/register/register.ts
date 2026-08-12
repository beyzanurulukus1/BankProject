import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  tckn = '';
  phoneNumber = '';
  dateOfBirth = '';

  errorMessage = '';
  successMessage = '';
  loading = false;


  register(): void {

    this.errorMessage = '';
    this.successMessage = '';

    // Boş alan kontrolü

    if (
      !this.firstName ||
      !this.lastName ||
      !this.email ||
      !this.password ||
      !this.confirmPassword ||
      !this.tckn ||
      !this.phoneNumber ||
      !this.dateOfBirth
    ) {

      this.errorMessage = 'Lütfen tüm alanları doldurun.';
      return;
    }


    // Şifre kontrolü

    if (this.password !== this.confirmPassword) {

      this.errorMessage = 'Şifreler eşleşmiyor.';
      return;
    }


    // TCKN kontrolü

    if (!/^\d{11}$/.test(this.tckn)) {

      this.errorMessage = 'TCKN 11 haneli olmalıdır.';
      return;
    }


    this.loading = true;


    this.authService.register({

      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      tckn: this.tckn,
      phoneNumber: this.phoneNumber,
      dateOfBirth: this.dateOfBirth

    }).subscribe({

      next: (response) => {

        console.log('✅ KAYIT BAŞARILI');
        console.log(response);

        this.loading = false;

        this.successMessage =
          'Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz.';

        setTimeout(() => {

          this.router.navigate(['/login']);

        }, 1500);

      },

      error: (err) => {

        console.error('❌ KAYIT BAŞARISIZ');
        console.error(err);

        this.loading = false;

        this.errorMessage =
          err.error?.Error ||
          err.error?.Message ||
          'Kayıt işlemi sırasında bir hata oluştu.';

      }

    });

  }


  goToLogin(): void {

    this.router.navigate(['/login']);

  }

}