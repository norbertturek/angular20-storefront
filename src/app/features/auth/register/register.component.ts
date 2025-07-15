import { Component, signal, computed, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@api/auth.service';
import { ButtonComponent } from '@ui/button/button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ButtonComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})

export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals for form fields
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  phone = signal('');
  password = signal('');
  confirmPassword = signal('');

  // Touched signals
  firstNameTouched = signal(false);
  lastNameTouched = signal(false);
  emailTouched = signal(false);
  phoneTouched = signal(false);
  passwordTouched = signal(false);
  confirmPasswordTouched = signal(false);

  // Error signals
  firstNameError = signal<string | null>(null);
  lastNameError = signal<string | null>(null);
  emailError = signal<string | null>(null);
  phoneError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  confirmPasswordError = signal<string | null>(null);

  // AuthService signals
  loading = computed(() => this.authService.loading());
  error = computed(() => this.authService.error());
  success = computed(() => this.authService.success());

  isFormValid = computed(() => {
    return (
      this.firstName().trim() !== '' &&
      this.lastName().trim() !== '' &&
      this.email().trim() !== '' &&
      this.phone().trim() !== '' &&
      this.password().trim() !== '' &&
      this.confirmPassword().trim() !== '' &&
      this.password() === this.confirmPassword() &&
      !this.firstNameError() &&
      !this.lastNameError() &&
      !this.emailError() &&
      !this.phoneError() &&
      !this.passwordError() &&
      !this.confirmPasswordError()
    );
  });

  validateFirstName() {
    this.firstNameError.set(
      this.firstName().trim() === '' ? 'First name is required.' : null
    );
  }
  validateLastName() {
    this.lastNameError.set(
      this.lastName().trim() === '' ? 'Last name is required.' : null
    );
  }
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
  validatePhone() {
    const value = this.phone().trim();
    if (!value) {
      this.phoneError.set('Phone is required.');
    } else if (!/^\+?\d{7,15}$/.test(value.replace(/\s/g, ''))) {
      this.phoneError.set('Invalid phone number.');
    } else {
      this.phoneError.set(null);
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
  validateConfirmPassword() {
    if (!this.confirmPassword()) {
      this.confirmPasswordError.set('Please confirm your password.');
    } else if (this.confirmPassword() !== this.password()) {
      this.confirmPasswordError.set('Passwords do not match.');
    } else {
      this.confirmPasswordError.set(null);
    }
  }

  onFirstNameBlur() {
    this.firstNameTouched.set(true);
    this.validateFirstName();
  }
  onLastNameBlur() {
    this.lastNameTouched.set(true);
    this.validateLastName();
  }
  onEmailBlur() {
    this.emailTouched.set(true);
    this.validateEmail();
  }
  onPhoneBlur() {
    this.phoneTouched.set(true);
    this.validatePhone();
  }
  onPasswordBlur() {
    this.passwordTouched.set(true);
    this.validatePassword();
  }
  onConfirmPasswordBlur() {
    this.confirmPasswordTouched.set(true);
    this.validateConfirmPassword();
  }

  onFirstNameInput(event: Event) {
    this.firstName.set((event.target as HTMLInputElement).value || '');
    if (this.firstNameTouched()) this.validateFirstName();
  }
  onLastNameInput(event: Event) {
    this.lastName.set((event.target as HTMLInputElement).value || '');
    if (this.lastNameTouched()) this.validateLastName();
  }
  onEmailInput(event: Event) {
    this.email.set((event.target as HTMLInputElement).value || '');
    if (this.emailTouched()) this.validateEmail();
  }
  onPhoneInput(event: Event) {
    this.phone.set((event.target as HTMLInputElement).value || '');
    if (this.phoneTouched()) this.validatePhone();
  }
  onPasswordInput(event: Event) {
    this.password.set((event.target as HTMLInputElement).value || '');
    if (this.passwordTouched()) this.validatePassword();
    if (this.confirmPasswordTouched()) this.validateConfirmPassword();
  }
  onConfirmPasswordInput(event: Event) {
    this.confirmPassword.set((event.target as HTMLInputElement).value || '');
    if (this.confirmPasswordTouched()) this.validateConfirmPassword();
  }

  async onSubmit($event: Event) {
    $event.preventDefault();
    this.firstNameTouched.set(true);
    this.lastNameTouched.set(true);
    this.emailTouched.set(true);
    this.phoneTouched.set(true);
    this.passwordTouched.set(true);
    this.confirmPasswordTouched.set(true);
    this.validateFirstName();
    this.validateLastName();
    this.validateEmail();
    this.validatePhone();
    this.validatePassword();
    this.validateConfirmPassword();
    if (
      this.firstNameError() ||
      this.lastNameError() ||
      this.emailError() ||
      this.phoneError() ||
      this.passwordError() ||
      this.confirmPasswordError()
    ) {
      return;
    }
    
    const result = await this.authService.register({
      email: this.email(),
      first_name: this.firstName(),
      last_name: this.lastName(),
      phone: this.phone(),
      password: this.password(),
    });
    
    if (result.success) {
      // Navigate to account page or home after successful registration
      this.router.navigate(['/account']);
    }
  }
} 