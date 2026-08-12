import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  tckn: string;
  phoneNumber: string;
  dateOfBirth: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  register(request: RegisterRequest) {

    return this.http.post<{
      message: string;
      userId: number;
    }>(
      `${environment.apiUrl}/auth/register`,
      request
    );

  }

  login(request: LoginRequest) {

    return this.http.post<{
      message: string;
      token: string;
    }>(
      `${environment.apiUrl}/auth/login`,
      request
    );

  }

}