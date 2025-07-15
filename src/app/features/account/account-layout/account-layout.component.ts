import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ButtonComponent } from '@/app/ui/button/button.component';
import { AuthService } from '@api/auth.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './account-layout.component.html',
  styleUrls: ['./account-layout.component.scss']
})
export class AccountLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  customer = this.authService.customer;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
} 