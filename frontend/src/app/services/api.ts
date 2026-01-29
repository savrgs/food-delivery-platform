import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ==================== INTERFACES ====================

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  cuisine_type: string;
  location_x: number;
  location_y: number;
  is_active: boolean;
}

export interface Dish {
  id: number;
  restaurant_id: number;
  name: string;
  description: string;
  price_cents: number;
  is_available: boolean;
}

export interface Order {
  id: number;
  user_id: number;
  restaurant_id: number;
  restaurant_name: string;
  status: string;
  total_cents: number;
  estimated_delivery_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  dish_id: number;
  dish_name: string;
  quantity: number;
  price_cents: number;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  delivery_address?: string;
}

export interface Review {
  id: number;
  restaurant_id?: number;
  dish_id?: number;
  user_id: number;
  rating: number;
  comment: string | null;
  reviewer_name?: string;
  created_at: string;
}

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  cuisine_type: string;
  location_x: number;
  location_y: number;
  is_active: boolean;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  // ========== RESTAURANTS ==========
  
  getRestaurants(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(`${this.base}/restaurants`);
  }

  getRestaurant(id: number): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.base}/restaurants/${id}`);
  }

  // ========== DISHES ==========

  getDishes(restaurantId: number): Observable<Dish[]> {
    return this.http.get<Dish[]>(`${this.base}/restaurants/${restaurantId}/dishes`);
  }

  // ========== ORDERS ==========

  createOrder(restaurantId: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders`, { restaurant_id: restaurantId });
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/orders`);
  }

  getOrder(orderId: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.base}/orders/${orderId}`);
  }

  // ========== CART (Order Items) ==========

  addItemToOrder(orderId: number, dishId: number, quantity: number): Observable<any> {
    return this.http.post(`${this.base}/orders/${orderId}/items`, { dish_id: dishId, quantity });
  }

  updateItemQuantity(orderId: number, dishId: number, quantity: number): Observable<any> {
    return this.http.patch(`${this.base}/orders/${orderId}/items`, { dish_id: dishId, quantity });
  }

  removeItemFromOrder(orderId: number, dishId: number): Observable<any> {
    return this.http.delete(`${this.base}/orders/${orderId}/items/${dishId}`);
  }

  checkoutOrder(orderId: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/${orderId}/checkout`, {});
  }

  // ========== ORDER STATUS ==========

  updateOrderStatus(orderId: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${orderId}/status`, { status });
  }

  cancelOrder(orderId: number): Observable<Order> {
    return this.updateOrderStatus(orderId, 'CANCELLED');
  }

  // ========== REVIEWS ==========

  getRestaurantReviews(restaurantId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/restaurants/${restaurantId}/reviews`);
  }

  createRestaurantReview(restaurantId: number, rating: number, comment?: string): Observable<Review> {
    return this.http.post<Review>(`${this.base}/restaurants/${restaurantId}/reviews`, { rating, comment });
  }

  getDishReviews(dishId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.base}/dishes/${dishId}/reviews`);
  }

  createDishReview(dishId: number, rating: number, comment?: string): Observable<Review> {
    return this.http.post<Review>(`${this.base}/dishes/${dishId}/reviews`, { rating, comment });
  }

  // ========== PROFILE ==========

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.patch(`${this.base}/me/password`, { 
      old_password: currentPassword, 
      new_password: newPassword 
    });
  }
}

