import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Restaurant, Dish, Review } from '../../services/api';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './restaurant-detail.component.html',
  styleUrl: './restaurant-detail.component.css'
})
export class RestaurantDetailComponent implements OnInit {
  restaurant: Restaurant | null = null;
  dishes: Dish[] = [];
  reviews: Review[] = [];
  loading = true;
  error = '';

  // Review form
  showReviewForm = false;
  newReview = { rating: 5, comment: '' };
  reviewSubmitting = false;

  // Dish review modal
  selectedDish: Dish | null = null;
  dishReviews: Review[] = [];
  showDishReviewForm = false;
  newDishReview = { rating: 5, comment: '' };
  dishReviewSubmitting = false;
  loadingDishReviews = false;

  // Cart state
  cartRestaurantId: number | null = null;
  cartItemCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cartService: CartService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid restaurant ID';
      this.loading = false;
      return;
    }

    // Subscribe to cart changes
    this.cartService.cart$.subscribe(cart => {
      this.cartRestaurantId = cart.restaurantId;
      this.cartItemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
      this.cdr.markForCheck();
    });

    this.loadRestaurant(id);
  }

  loadRestaurant(id: number): void {
    this.loading = true;

    // Load restaurant details
    this.api.getRestaurants().subscribe({
      next: (restaurants) => {
        this.restaurant = restaurants.find(r => r.id === id) || null;
        if (!this.restaurant) {
          this.error = 'Restaurant not found';
          this.loading = false;
          return;
        }
        this.loadDishes(id);
        this.loadReviews(id);
      },
      error: (err) => {
        this.error = 'Failed to load restaurant';
        this.loading = false;
        console.error(err);
      }
    });
  }

  loadDishes(restaurantId: number): void {
    this.api.getDishes(restaurantId).subscribe({
      next: (dishes) => {
        this.dishes = dishes;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load dishes:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadReviews(restaurantId: number): void {
    this.api.getRestaurantReviews(restaurantId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load reviews:', err);
      }
    });
  }

  get averageRating(): number {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / this.reviews.length) * 10) / 10;
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  // ========== CART ACTIONS ==========

  addToCart(dish: Dish): void {
    if (!this.restaurant) return;

    // If cart is empty or same restaurant, add item
    if (!this.cartRestaurantId || this.cartRestaurantId === this.restaurant.id) {
      // Start order if no active order for this restaurant
      if (!this.cartRestaurantId) {
        this.cartService.startOrder(this.restaurant.id, this.restaurant.name).subscribe({
          next: () => {
            this.addDishToCart(dish);
          },
          error: (err) => {
            console.error('Failed to start order:', err);
            this.toast.error('Failed to add item. Please try again.');
          }
        });
      } else {
        this.addDishToCart(dish);
      }
    } else {
      // Different restaurant - confirm clear cart
      if (confirm('You have items from another restaurant. Clear cart and start new order?')) {
        this.cartService.clearCart();
        this.cartService.startOrder(this.restaurant.id, this.restaurant.name).subscribe({
          next: () => {
            this.addDishToCart(dish);
          },
          error: (err) => {
            console.error('Failed to start order:', err);
          }
        });
      }
    }
  }

  private addDishToCart(dish: Dish): void {
    this.cartService.addItem(dish, 1).subscribe({
      next: () => {
        this.toast.success(`${dish.name} added to cart!`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to add to cart:', err);
        this.toast.error('Failed to add item to cart.');
      }
    });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  // ========== REVIEWS ==========

  toggleReviewForm(): void {
    this.showReviewForm = !this.showReviewForm;
    this.newReview = { rating: 5, comment: '' };
  }

  submitReview(): void {
    if (!this.restaurant) return;

    this.reviewSubmitting = true;
    this.api.createRestaurantReview(this.restaurant.id, this.newReview.rating, this.newReview.comment).subscribe({
      next: (review) => {
        this.reviews.unshift(review);
        this.showReviewForm = false;
        this.newReview = { rating: 5, comment: '' };
        this.reviewSubmitting = false;
        this.toast.success('Review submitted successfully!');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to submit review:', err);
        this.toast.error('Failed to submit review. Please try again.');
        this.reviewSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  // ========== DISH REVIEWS ==========

  openDishReviews(dish: Dish): void {
    this.selectedDish = dish;
    this.dishReviews = [];
    this.showDishReviewForm = false;
    this.newDishReview = { rating: 5, comment: '' };
    this.loadingDishReviews = true;

    this.api.getDishReviews(dish.id).subscribe({
      next: (reviews) => {
        this.dishReviews = reviews;
        this.loadingDishReviews = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load dish reviews:', err);
        this.loadingDishReviews = false;
        this.cdr.markForCheck();
      }
    });
  }

  closeDishModal(): void {
    this.selectedDish = null;
    this.dishReviews = [];
    this.showDishReviewForm = false;
  }

  toggleDishReviewForm(): void {
    this.showDishReviewForm = !this.showDishReviewForm;
    this.newDishReview = { rating: 5, comment: '' };
  }

  submitDishReview(): void {
    if (!this.selectedDish) return;

    this.dishReviewSubmitting = true;
    this.api.createDishReview(this.selectedDish.id, this.newDishReview.rating, this.newDishReview.comment).subscribe({
      next: (review) => {
        this.dishReviews.unshift(review);
        this.showDishReviewForm = false;
        this.newDishReview = { rating: 5, comment: '' };
        this.dishReviewSubmitting = false;
        this.toast.success('Review submitted successfully!');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to submit dish review:', err);
        this.toast.error('Failed to submit review. Please try again.');
        this.dishReviewSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  getDishAverageRating(): number {
    if (this.dishReviews.length === 0) return 0;
    const sum = this.dishReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / this.dishReviews.length) * 10) / 10;
  }
}
