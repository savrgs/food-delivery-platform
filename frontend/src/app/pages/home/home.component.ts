import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Restaurant } from '../../services/api';
import { AuthService } from '../../services/auth.service';
import { CartService, CartState } from '../../services/cart.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  restaurants: Restaurant[] = [];
  filteredRestaurants: Restaurant[] = [];
  currentUser: any = null;
  cart: CartState | null = null;
  
  // Filter options
  cuisineTypes: string[] = [];
  filters = {
    cuisine: '',
    minRating: 0,
    maxDeliveryTime: 60,
    maxDistance: 20,
    searchQuery: ''
  };
  showFilters = false;

  // User location for distance calculation
  userLocation = { x: 0, y: 0 };

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get current user and their location
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.markForCheck();
    });

    // Get user profile for location
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userLocation = { x: profile.location_x, y: profile.location_y };
        this.applyFilters();
      }
    });

    // Subscribe to cart
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cdr.markForCheck();
    });

    // Load restaurants
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.api.getRestaurants().subscribe({
      next: (data) => {
        console.log('Restaurants loaded:', data);
        this.restaurants = data;
        
        // Extract unique cuisine types for filter dropdown
        const cuisines = new Set(data.map(r => r.cuisine_type).filter(c => c));
        this.cuisineTypes = Array.from(cuisines).sort();
        
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading restaurants:', error);
      }
    });
  }

  // Calculate Manhattan distance (rounded to 1 decimal)
  calculateDistance(restaurant: Restaurant): number {
    const locX = restaurant.location_x ?? 0;
    const locY = restaurant.location_y ?? 0;
    const distance = Math.abs(this.userLocation.x - locX) + Math.abs(this.userLocation.y - locY);
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  // Estimate delivery time based on distance (varies more realistically)
  estimateDeliveryTime(restaurant: Restaurant): number {
    const distance = this.calculateDistance(restaurant);
    // Base time 15 min + 3 min per km
    const time = Math.round(15 + distance * 3);
    // Round to nearest 5 minutes
    return Math.ceil(time / 5) * 5;
  }

  // Apply all filters
  applyFilters(): void {
    let result = [...this.restaurants];

    // Filter by search query
    if (this.filters.searchQuery.trim()) {
      const query = this.filters.searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) ||
        (r.cuisine_type && r.cuisine_type.toLowerCase().includes(query))
      );
    }

    // Filter by cuisine type
    if (this.filters.cuisine) {
      result = result.filter(r => r.cuisine_type === this.filters.cuisine);
    }

    // Filter by delivery time
    if (this.filters.maxDeliveryTime < 60) {
      result = result.filter(r => this.estimateDeliveryTime(r) <= this.filters.maxDeliveryTime);
    }

    // Filter by distance
    if (this.filters.maxDistance < 20) {
      result = result.filter(r => this.calculateDistance(r) <= this.filters.maxDistance);
    }

    this.filteredRestaurants = result;
    this.cdr.markForCheck();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  clearFilters(): void {
    this.filters = {
      cuisine: '',
      minRating: 0,
      maxDeliveryTime: 60,
      maxDistance: 20,
      searchQuery: ''
    };
    this.applyFilters();
  }

  get cartItemCount(): number {
    if (!this.cart) return 0;
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  viewRestaurant(restaurant: Restaurant): void {
    this.router.navigate(['/restaurant', restaurant.id]);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
  }
}
