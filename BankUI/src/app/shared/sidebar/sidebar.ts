import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth';
@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);
  logout(): void {
  this.authService.logout();
}
}
