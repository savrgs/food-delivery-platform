import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { HomeComponent } from './pages/home/home.component';
import { RestaurantDetailComponent } from './pages/restaurant-detail/restaurant-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderTrackingComponent } from './pages/order-tracking/order-tracking.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  
  // Protected routes (require authentication)
  { 
    path: '', 
    component: HomeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'restaurant/:id',
    component: RestaurantDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'cart',
    component: CartComponent,
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [authGuard]
  },
  {
    path: 'orders/:id',
    component: OrderTrackingComponent,
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },
  
  // Redirect unknown routes to home
  { path: '**', redirectTo: '' }
];
