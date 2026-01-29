import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService, CartItem, CartState } from '../../services/cart.service';
import { ApiService } from '../../services/api';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {
  cart: CartState | null = null;
  submitting = false;
  error = '';

  constructor(
    private cartService: CartService,
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.markForCheck();
    });
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  get totalItems(): number {
    if (!this.cart) return 0;
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalPrice(): number {
    if (!this.cart) return 0;
    return this.cart.items.reduce((sum, item) => sum + (item.dish.price_cents * item.quantity), 0);
  }

  updateQuantity(item: CartItem, delta: number): void {
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      this.removeItem(item);
      return;
    }

    this.cartService.updateQuantity(item.dish.id, newQty).subscribe({
      next: () => this.cdr.markForCheck(),
      error: (err) => {
        console.error('Failed to update quantity:', err);
        this.error = 'Failed to update quantity';
        this.cdr.markForCheck();
      }
    });
  }

  removeItem(item: CartItem): void {
    if (confirm(`Remove ${item.dish.name} from cart?`)) {
      this.cartService.removeItem(item.dish.id).subscribe({
        next: () => this.cdr.markForCheck(),
        error: (err) => {
          console.error('Failed to remove item:', err);
          this.error = 'Failed to remove item';
          this.cdr.markForCheck();
        }
      });
    }
  }

  clearCart(): void {
    if (confirm('Clear all items from cart?')) {
      this.cartService.clearCart();
      this.cdr.markForCheck();
    }
  }

  checkout(): void {
    if (!this.cart?.orderId || this.cart.items.length === 0) {
      this.error = 'Cart is empty';
      return;
    }

    this.submitting = true;
    this.error = '';

    // Checkout the order (confirm it)
    this.api.checkoutOrder(this.cart.orderId).subscribe({
      next: (order) => {
        const orderId = this.cart!.orderId;
        this.cartService.clearCart();
        this.toast.success('Order placed successfully!');
        this.router.navigate(['/orders', orderId]);
      },
      error: (err) => {
        console.error('Checkout failed:', err);
        this.error = err.error?.error || 'Checkout failed. Please try again.';
        this.toast.error(this.error);
        this.submitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  continueShopping(): void {
    if (this.cart?.restaurantId) {
      this.router.navigate(['/restaurant', this.cart.restaurantId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
