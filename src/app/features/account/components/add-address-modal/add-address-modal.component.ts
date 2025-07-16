import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@/app/ui/button/button.component';
import { CustomerService, AddressPayload } from '@api/customer.service';
import { AuthService } from '@api/auth.service';
import { ToastService } from '@services/toast.service';

interface Address {
  id: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country_code?: string;
  phone?: string;
}

@Component({
  selector: 'app-add-address-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './add-address-modal.component.html',
  styleUrls: ['./add-address-modal.component.scss']
})
export class AddAddressModalComponent {
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // Modal state
  isOpen = signal(false);
  addressId = signal<string | null>(null); // null = add mode, string = edit mode

  // Form fields
  firstName = signal('');
  lastName = signal('');
  company = signal('');
  address1 = signal('');
  address2 = signal('');
  city = signal('');
  province = signal('');
  postalCode = signal('');
  countryCode = signal('US'); // Default to US
  phone = signal('');

  // Form validation
  firstNameTouched = signal(false);
  lastNameTouched = signal(false);
  address1Touched = signal(false);
  cityTouched = signal(false);
  postalCodeTouched = signal(false);
  countryCodeTouched = signal(false);

  firstNameError = signal<string | null>(null);
  lastNameError = signal<string | null>(null);
  address1Error = signal<string | null>(null);
  cityError = signal<string | null>(null);
  postalCodeError = signal<string | null>(null);
  countryCodeError = signal<string | null>(null);

  loading = computed(() => this.customerService.loading());
  error = computed(() => this.customerService.error());

  isFormValid = computed(() => {
    return (
      this.firstName().trim() !== '' &&
      this.lastName().trim() !== '' &&
      this.address1().trim() !== '' &&
      this.city().trim() !== '' &&
      this.postalCode().trim() !== '' &&
      this.countryCode().trim() !== '' &&
      !this.firstNameError() &&
      !this.lastNameError() &&
      !this.address1Error() &&
      !this.cityError() &&
      !this.postalCodeError() &&
      !this.countryCodeError()
    );
  });

  // Country options
  countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'PL', name: 'Poland' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'AT', name: 'Austria' },
    { code: 'IE', name: 'Ireland' },
    { code: 'PT', name: 'Portugal' },
    { code: 'GR', name: 'Greece' },
    { code: 'CZ', name: 'Czech Republic' },
    { code: 'HU', name: 'Hungary' },
    { code: 'RO', name: 'Romania' },
    { code: 'BG', name: 'Bulgaria' },
    { code: 'HR', name: 'Croatia' },
    { code: 'SI', name: 'Slovenia' },
    { code: 'SK', name: 'Slovakia' },
    { code: 'LT', name: 'Lithuania' },
    { code: 'LV', name: 'Latvia' },
    { code: 'EE', name: 'Estonia' },
    { code: 'MT', name: 'Malta' },
    { code: 'CY', name: 'Cyprus' },
    { code: 'LU', name: 'Luxembourg' }
  ];

  open(addressId?: string) {
    this.isOpen.set(true);
    this.addressId.set(addressId || null);
    
    if (addressId) {
      // Edit mode - load address data
      this.loadAddressData(addressId);
    } else {
      // Add mode - reset form
      this.resetForm();
    }
  }

  close() {
    this.isOpen.set(false);
    this.resetForm();
    this.addressId.set(null);
  }

  loadAddressData(addressId: string) {
    const customer = this.authService.customer();
    const address = customer?.addresses?.find((addr: Address) => addr.id === addressId);
    
    console.log('Loading address data:', address);
    
    if (address) {
      this.firstName.set(address.first_name || '');
      this.lastName.set(address.last_name || '');
      this.company.set(address.company || '');
      this.address1.set(address.address_1 || '');
      this.address2.set(address.address_2 || '');
      this.city.set(address.city || '');
      this.province.set(address.province || '');
      this.postalCode.set(address.postal_code || '');
      
      console.log('Setting country code to:', address.country_code);
      this.countryCode.set(address.country_code || 'US');
      
      this.phone.set(address.phone || '');
      
      // Daj Angular czas na zaktualizowanie signal
      setTimeout(() => {
        console.log('Country code after setTimeout:', this.countryCode());
      }, 0);
    }
    
    this.clearErrors();
    this.clearTouched();
  }

  resetForm() {
    this.firstName.set('');
    this.lastName.set('');
    this.company.set('');
    this.address1.set('');
    this.address2.set('');
    this.city.set('');
    this.province.set('');
    this.postalCode.set('');
    this.countryCode.set('US');
    this.phone.set('');
    
    this.clearErrors();
    this.clearTouched();
  }

  clearErrors() {
    this.firstNameError.set(null);
    this.lastNameError.set(null);
    this.address1Error.set(null);
    this.cityError.set(null);
    this.postalCodeError.set(null);
    this.countryCodeError.set(null);
  }

  clearTouched() {
    this.firstNameTouched.set(false);
    this.lastNameTouched.set(false);
    this.address1Touched.set(false);
    this.cityTouched.set(false);
    this.postalCodeTouched.set(false);
    this.countryCodeTouched.set(false);
  }

  // Input handlers
  onFirstNameInput(event: Event) {
    this.firstName.set((event.target as HTMLInputElement).value || '');
    if (this.firstNameTouched()) this.validateFirstName();
  }

  onLastNameInput(event: Event) {
    this.lastName.set((event.target as HTMLInputElement).value || '');
    if (this.lastNameTouched()) this.validateLastName();
  }

  onCompanyInput(event: Event) {
    this.company.set((event.target as HTMLInputElement).value || '');
  }

  onAddress1Input(event: Event) {
    this.address1.set((event.target as HTMLInputElement).value || '');
    if (this.address1Touched()) this.validateAddress1();
  }

  onAddress2Input(event: Event) {
    this.address2.set((event.target as HTMLInputElement).value || '');
  }

  onCityInput(event: Event) {
    this.city.set((event.target as HTMLInputElement).value || '');
    if (this.cityTouched()) this.validateCity();
  }

  onProvinceInput(event: Event) {
    this.province.set((event.target as HTMLInputElement).value || '');
  }

  onPostalCodeInput(event: Event) {
    this.postalCode.set((event.target as HTMLInputElement).value || '');
    if (this.postalCodeTouched()) this.validatePostalCode();
  }

  onPhoneInput(event: Event) {
    this.phone.set((event.target as HTMLInputElement).value || '');
  }

  // Blur handlers
  onFirstNameBlur() {
    this.firstNameTouched.set(true);
    this.validateFirstName();
  }

  onLastNameBlur() {
    this.lastNameTouched.set(true);
    this.validateLastName();
  }

  onAddress1Blur() {
    this.address1Touched.set(true);
    this.validateAddress1();
  }

  onCityBlur() {
    this.cityTouched.set(true);
    this.validateCity();
  }

  onPostalCodeBlur() {
    this.postalCodeTouched.set(true);
    this.validatePostalCode();
  }

  onCountryCodeBlur() {
    this.countryCodeTouched.set(true);
    this.validateCountryCode();
  }

  // Validation methods
  validateFirstName() {
    const value = this.firstName().trim();
    if (!value) {
      this.firstNameError.set('First name is required.');
    } else {
      this.firstNameError.set(null);
    }
  }

  validateLastName() {
    const value = this.lastName().trim();
    if (!value) {
      this.lastNameError.set('Last name is required.');
    } else {
      this.lastNameError.set(null);
    }
  }

  validateAddress1() {
    const value = this.address1().trim();
    if (!value) {
      this.address1Error.set('Address is required.');
    } else {
      this.address1Error.set(null);
    }
  }

  validateCity() {
    const value = this.city().trim();
    if (!value) {
      this.cityError.set('City is required.');
    } else {
      this.cityError.set(null);
    }
  }

  validatePostalCode() {
    const value = this.postalCode().trim();
    if (!value) {
      this.postalCodeError.set('Postal code is required.');
    } else {
      this.postalCodeError.set(null);
    }
  }

  validateCountryCode() {
    const value = this.countryCode().trim();
    if (!value) {
      this.countryCodeError.set('Country is required.');
    } else {
      this.countryCodeError.set(null);
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    
    // Mark all fields as touched
    this.firstNameTouched.set(true);
    this.lastNameTouched.set(true);
    this.address1Touched.set(true);
    this.cityTouched.set(true);
    this.postalCodeTouched.set(true);
    this.countryCodeTouched.set(true);
    
    // Validate all fields
    this.validateFirstName();
    this.validateLastName();
    this.validateAddress1();
    this.validateCity();
    this.validatePostalCode();
    this.validateCountryCode();
    
    if (!this.isFormValid()) {
      return;
    }
    
    const payload: AddressPayload = {
      first_name: this.firstName(),
      last_name: this.lastName(),
      company: this.company() || undefined,
      address_1: this.address1(),
      address_2: this.address2() || undefined,
      city: this.city(),
      province: this.province() || undefined,
      postal_code: this.postalCode(),
      country_code: this.countryCode(),
      phone: this.phone() || undefined
    };
    
    let result;
    if (this.addressId()) {
      // Edit mode
      result = await this.customerService.updateAddress(this.addressId()!, payload);
    } else {
      // Add mode
      result = await this.customerService.addAddress(payload);
    }
    
    if (result.success) {
      // Update customer data in auth service
      if (result.customer) {
        this.authService.updateCustomer(result.customer);
      }
      this.close();
    }
  }
} 