import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, Order } from '../../services/api';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  error = '';

  readonly statusLabels: { [key: string]: string } = {
    'PENDING': 'Pending',
    'CONFIRMED': 'Confirmed',
    'PREPARING': 'Preparing',
    'OUT_FOR_DELIVERY': 'On the Way',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled'
  };

  readonly statusColors: { [key: string]: string } = {
    'PENDING': 'status-pending',
    'CONFIRMED': 'status-confirmed',
    'PREPARING': 'status-preparing',
    'OUT_FOR_DELIVERY': 'status-delivery',
    'DELIVERED': 'status-delivered',
    'CANCELLED': 'status-cancelled'
  };

  constructor(
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.api.getOrders().subscribe({
      next: (orders) => {
        // Sort by newest first
        this.orders = orders.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.error = 'Failed to load orders';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  get activeOrders(): Order[] {
    return this.orders.filter(o => 
      o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );
  }

  get pastOrders(): Order[] {
    return this.orders.filter(o => 
      o.status === 'DELIVERED' || o.status === 'CANCELLED'
    );
  }
}
