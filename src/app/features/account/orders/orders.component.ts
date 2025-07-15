import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonComponent } from '@/app/ui/button/button.component';
import { AuthService } from '@api/auth.service';
import { CustomerService } from '@api/customer.service';

interface Order {
  id: string;
  display_id: number;
  status: string;
  total: number;
  currency_code: string;
  created_at: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonComponent],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  private authService = inject(AuthService);
  private customerService = inject(CustomerService);
  
  // Make Math available in template
  protected Math = Math;

  customer = this.authService.customer;
  orders = signal<Order[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  totalOrders = signal(0);
  pageSize = 10;
  currentPage = signal(0);

  hasOrders = computed(() => this.orders().length > 0);
  isLoading = computed(() => this.loading());

  ngOnInit() { this.loadOrders(); }

  async loadOrders() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const result = await this.customerService.getOrders(
        this.pageSize,
        this.currentPage() * this.pageSize
      );
      if (result.success && result.orders) {
        this.orders.set(result.orders);
        this.totalOrders.set(result.count || 0);
      } else {
        this.error.set(result.error || 'Failed to load orders.');
      }
    } catch (err) {
      this.error.set('Failed to load orders. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadOrders();
  }

  getStatusLabel(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }
  viewOrderDetails(orderId: string) {
    // TODO: Navigate to order details page
    console.log('View order details:', orderId);
  }
} 