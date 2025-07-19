import { Component, inject, signal, computed, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@/app/ui/button/button.component';
import { AuthService } from '@api/auth.service';
import { CustomerService } from '@api/customer.service';
import { ToastService } from '@services/toast.service';
import { AddAddressModalComponent } from '../components/add-address-modal/add-address-modal.component';
import { DeleteConfirmationModalComponent } from '../components/delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-personal-security',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonComponent, AddAddressModalComponent, DeleteConfirmationModalComponent],
  templateUrl: './personal-security.component.html',
  styleUrls: ['./personal-security.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonalSecurityComponent {
  private authService = inject(AuthService);
  private customerService = inject(CustomerService);
  private toastService = inject(ToastService);

  @ViewChild(DeleteConfirmationModalComponent) deleteConfirmationModal!: DeleteConfirmationModalComponent;

  customer = this.authService.customer;

  // Inicjalizacja signals z customer data
  private initialCustomer = this.customer();

  isEditing = signal(false);
  firstName = signal(this.initialCustomer?.first_name || '');
  lastName = signal(this.initialCustomer?.last_name || '');
  phone = signal(this.initialCustomer?.phone || '');

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
      // Update customer data in auth service
      this.authService.updateCustomer(result.customer);
      this.isEditing.set(false);
      // Toast notification is handled by CustomerService
    } else {
      // Toast notification is handled by CustomerService
    }
  }

  async deleteAddress(addressId: string) {
    this.deleteConfirmationModal.open(addressId, async (id: string) => {
      const result = await this.customerService.deleteAddress(id);
      
      if (result.success) {
        // Update customer data in auth service with the returned customer data
        if (result.customer) {
          this.authService.updateCustomer(result.customer);
        } else {
          // If no customer data returned (address was already deleted), 
          // we need to refresh the customer data to update the UI
          // This is a fallback to ensure the UI updates
          const currentCustomer = this.customer();
          if (currentCustomer && currentCustomer.addresses) {
            // Remove the deleted address from the current customer data
            const updatedCustomer = {
              ...currentCustomer,
              addresses: currentCustomer.addresses.filter((addr: any) => addr.id !== id)
            };
            this.authService.updateCustomer(updatedCustomer);
          }
        }
      }
    });
  }

  async requestPasswordReset() {
    const customer = this.customer();
    if (!customer?.email) {
      this.toastService.error('Email not found', 'Password Reset Error');
      return;
    }
    
    await this.customerService.requestPasswordReset(customer.email);
  }
} 