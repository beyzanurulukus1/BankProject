import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { DashboardResponse } from '../models/dashboard-response';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private http = inject(HttpClient);

  getDashboard() {

    return this.http.get<{
      isSuccess: boolean;
      data: DashboardResponse;
    }>(`${environment.apiUrl}/Dashboard`);
    
  }
  

}