import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@api/auth.service';
import { ButtonComponent } from '@ui/button/button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');

  emailTouched = signal(false);
  passwordTouched = signal(false);

  emailError = signal<string | null>(null);
  passwordError = signal<string | null>(null);

  loading = computed(() => this.authService.loading());
  error = computed(() => this.authService.error());
  success = computed(() => this.authService.success());

  isFormValid = computed(() => {
    return (
      this.email().trim() !== '' &&
      this.password().trim() !== '' &&
      !this.emailError() &&
      !this.passwordError()
    );
  });

  validateEmail() {
    const value = this.email().trim();
    if (!value) {
      this.emailError.set('Email is required.');
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      this.emailError.set('Invalid email address.');
    } else {
      this.emailError.set(null);
    }
  }

  validatePassword() {
    const value = this.password();
    if (!value) {
      this.passwordError.set('Password is required.');
    } else if (value.length < 6) {
      this.passwordError.set('Password must be at least 6 characters.');
    } else {
      this.passwordError.set(null);
    }
  }

  onEmailBlur() {
    this.emailTouched.set(true);
    this.validateEmail();
  }

  onPasswordBlur() {
    this.passwordTouched.set(true);
    this.validatePassword();
  }

  onEmailInput(event: Event) {
    this.email.set((event.target as HTMLInputElement).value || '');
    if (this.emailTouched()) this.validateEmail();
  }

  onPasswordInput(event: Event) {
    this.password.set((event.target as HTMLInputElement).value || '');
    if (this.passwordTouched()) this.validatePassword();
  }

  async onSubmit($event: Event) {
    $event.preventDefault();
    this.emailTouched.set(true);
    this.passwordTouched.set(true);
    this.validateEmail();
    this.validatePassword();
    if (this.emailError() || this.passwordError()) {
      return;
    }
    
    const result = await this.authService.login({
      email: this.email(),
      password: this.password(),
    });
    
    if (result.success) {
      if (result.redirectUrl) {
        this.router.navigate([result.redirectUrl]);
      } else {
        this.router.navigate(['/account']);
      }
    }
  }
}
