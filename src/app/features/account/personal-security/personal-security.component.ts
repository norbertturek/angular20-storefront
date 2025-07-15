import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@/app/ui/button/button.component';
import { AuthService } from '@api/auth.service';
import { CustomerService } from '@api/customer.service';
import { ToastService } from '@services/toast.service';

@Component({
  selector: 'app-personal-security',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent],
  templateUrl: './personal-security.component.html',
  styleUrls: ['./personal-security.component.scss']
})
export class PersonalSecurityComponent implements OnInit {
  private authService = inject(AuthService);
  private customerService = inject(CustomerService);
  private toastService = inject(ToastService);

  customer = this.authService.customer;

  isEditing = signal(false);
  firstName = signal('');
  lastName = signal('');
  phone = signal('');

  firstNameError = signal<string | null>(null);
  lastNameError = signal<string | null>(null);
  phoneError = signal<string | null>(null);

  isFormValid = computed(() => {
    return (
      this.firstName().trim() !== '' &&
      this.lastName().trim() !== '' &&
      !this.firstNameError() &&
      !this.lastNameError() &&
      !this.phoneError()
    );
  });

  ngOnInit() {
    const customer = this.customer();
    if (customer) {
      this.firstName.set(customer.first_name || '');
      this.lastName.set(customer.last_name || '');
      this.phone.set(customer.phone || '');
    }
  }

  startEditing() { this.isEditing.set(true); }
  cancelEditing() {
    this.isEditing.set(false);
    const customer = this.customer();
    if (customer) {
      this.firstName.set(customer.first_name || '');
      this.lastName.set(customer.last_name || '');
      this.phone.set(customer.phone || '');
    }
    this.clearErrors();
  }

  validateFirstName() {
    this.firstNameError.set(this.firstName().trim() === '' ? 'First name is required.' : null);
  }
  validateLastName() {
    this.lastNameError.set(this.lastName().trim() === '' ? 'Last name is required.' : null);
  }
  validatePhone() {
    const value = this.phone().trim();
    if (value && !/^\+?\d{7,15}$/.test(value.replace(/\s/g, ''))) {
      this.phoneError.set('Invalid phone number.');
    } else {
      this.phoneError.set(null);
    }
  }
  clearErrors() {
    this.firstNameError.set(null);
    this.lastNameError.set(null);
    this.phoneError.set(null);
  }

  async saveChanges() {
    this.validateFirstName();
    this.validateLastName();
    this.validatePhone();
    if (!this.isFormValid()) return;
    
    const result = await this.customerService.updateCustomer({
      first_name: this.firstName(),
      last_name: this.lastName(),
      phone: this.phone(),
    });
    
    if (result.success && result.customer) {
      this.authService.customer.set(result.customer);
      this.isEditing.set(false);
      // Toast notification is handled by CustomerService
    } else {
      // Toast notification is handled by CustomerService
    }
  }

  async requestPasswordReset() {
    const customer = this.customer();
    if (!customer?.email) {
      this.toastService.error('Email not found', 'Password Reset Error');
      return;
    }
    
    const result = await this.customerService.requestPasswordReset(customer.email);
    // Toast notification is handled by CustomerService
  }
} 