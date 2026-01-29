import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService, Dish, Order, OrderDetail } from './api';

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export interface CartState {
  orderId: number | null;
  restaurantId: number | null;
  restaurantName: string;
  items: CartItem[];
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private initialState: CartState = {
    orderId: null,
    restaurantId: null,
    restaurantName: '',
    items: [],
    loading: false
  };

  private cartSubject = new BehaviorSubject<CartState>(this.initialState);
  public cart$ = this.cartSubject.asObservable();

  constructor(private api: ApiService) {
    // Load cart from localStorage on init
    this.loadFromStorage();
  }

  // ========== GETTERS ==========

  get currentCart(): CartState {
    return this.cartSubject.value;
  }

  get itemCount(): number {
    return this.currentCart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get totalCents(): number {
    return this.currentCart.items.reduce(
      (sum, item) => sum + (item.dish.price_cents * item.quantity), 
      0
    );
  }

  get totalFormatted(): string {
    return (this.totalCents / 100).toFixed(2);
  }

  // ========== ACTIONS ==========

  /**
   * Start a new order for a restaurant
   */
  startOrder(restaurantId: number, restaurantName: string): Observable<Order> {
    this.updateState({ loading: true });
    
    return this.api.createOrder(restaurantId).pipe(
      tap(order => {
        this.updateState({
          orderId: order.id,
          restaurantId: restaurantId,
          restaurantName: restaurantName,
          items: [],
          loading: false
        });
        this.saveToStorage();
      })
    );
  }

  /**
   * Add a dish to the cart
   */
  addItem(dish: Dish, quantity: number = 1): Observable<any> {
    const { orderId } = this.currentCart;
    if (!orderId) {
      throw new Error('No active order. Call startOrder first.');
    }

    this.updateState({ loading: true });

    return this.api.addItemToOrder(orderId, dish.id, quantity).pipe(
      tap(() => {
        const items = [...this.currentCart.items];
        const existing = items.find(i => i.dish.id === dish.id);
        
        if (existing) {
          existing.quantity += quantity;
        } else {
          items.push({ dish, quantity });
        }

        this.updateState({ items, loading: false });
        this.saveToStorage();
      })
    );
  }

  /**
   * Update quantity of an item
   */
  updateQuantity(dishId: number, quantity: number): Observable<any> {
    const { orderId } = this.currentCart;
    if (!orderId) throw new Error('No active order');

    this.updateState({ loading: true });

    if (quantity <= 0) {
      return this.removeItem(dishId);
    }

    return this.api.updateItemQuantity(orderId, dishId, quantity).pipe(
      tap(() => {
        const items = this.currentCart.items.map(item =>
          item.dish.id === dishId ? { ...item, quantity } : item
        );
        this.updateState({ items, loading: false });
        this.saveToStorage();
      })
    );
  }

  /**
   * Remove an item from cart
   */
  removeItem(dishId: number): Observable<any> {
    const { orderId } = this.currentCart;
    if (!orderId) throw new Error('No active order');

    this.updateState({ loading: true });

    return this.api.removeItemFromOrder(orderId, dishId).pipe(
      tap(() => {
        const items = this.currentCart.items.filter(i => i.dish.id !== dishId);
        this.updateState({ items, loading: false });
        this.saveToStorage();
      })
    );
  }

  /**
   * Clear the cart completely
   */
  clearCart(): void {
    this.cartSubject.next(this.initialState);
    localStorage.removeItem('cart');
  }

  /**
   * Sync cart with backend order
   */
  syncWithOrder(orderId: number): Observable<OrderDetail> {
    this.updateState({ loading: true });
    
    return this.api.getOrder(orderId).pipe(
      tap(detail => {
        // Note: We'd need to fetch dish details to rebuild cart items
        // For now just update orderId
        this.updateState({ 
          orderId: detail.id,
          restaurantId: detail.restaurant_id,
          loading: false 
        });
      })
    );
  }

  // ========== PERSISTENCE ==========

  private saveToStorage(): void {
    const cart = this.currentCart;
    localStorage.setItem('cart', JSON.stringify({
      orderId: cart.orderId,
      restaurantId: cart.restaurantId,
      restaurantName: cart.restaurantName,
      items: cart.items
    }));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.updateState({
          orderId: parsed.orderId || null,
          restaurantId: parsed.restaurantId || null,
          restaurantName: parsed.restaurantName || '',
          items: parsed.items || []
        });
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }

  // ========== HELPERS ==========

  private updateState(partial: Partial<CartState>): void {
    this.cartSubject.next({ ...this.currentCart, ...partial });
  }
}
