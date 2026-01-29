import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  formData = {
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    address: ''
  };

  loading = false;
  error = '';
  success = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Clear error message
   */
  clearError(): void {
    this.error = '';
  }

  onSubmit(): void {
    // Reset messages
    this.clearError();

    // Validation
    if (!this.formData.email || !this.formData.password) {
      this.error = 'Email and password are required';
      this.cdr.markForCheck();
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      this.error = 'Passwords do not match';
      this.cdr.markForCheck();
      return;
    }

    if (this.formData.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    // Generate random coordinates automatically
    const location_x = Math.floor(Math.random() * 20) - 10; // -10 to 10
    const location_y = Math.floor(Math.random() * 20) - 10;

    // Prepare data for backend
    const registerData = {
      email: this.formData.email,
      password: this.formData.password,
      full_name: this.formData.full_name || undefined,
      address: this.formData.address || undefined,
      location_x,
      location_y
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.success = true;
        this.loading = false;
        this.cdr.markForCheck();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { registered: 'true' } 
          });
        }, 2000);
      },
      error: (err) => {
        this.loading = false;

        // Extract error message from different response formats
        let errorMsg = 'Registration failed. Please try again.';

        if (err.error) {
          if (typeof err.error === 'object') {
            if (err.error.error) {
              errorMsg = err.error.error;
            } else if (err.error.message) {
              errorMsg = err.error.message;
            }
          } else if (typeof err.error === 'string') {
            errorMsg = err.error;
          }
        }

        // User-friendly error messages based on status and content
        if (err.status === 409 || errorMsg.toLowerCase().includes('email already exists')) {
          this.error = 'An account with this email already exists. Please login or use a different email.';
        } else if (err.status === 400 || errorMsg.toLowerCase().includes('required')) {
          this.error = errorMsg;
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else if (err.status === 0) {
          this.error = 'Connection error. Please check your internet connection.';
        } else {
          this.error = errorMsg || 'Registration failed. Please try again.';
        }

        this.cdr.markForCheck();
      }
    });
  }
}
