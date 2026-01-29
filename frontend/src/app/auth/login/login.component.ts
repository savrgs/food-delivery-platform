import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

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
    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      this.cdr.markForCheck();
      return;
    }

    if (!this.email.includes('@')) {
      this.error = 'Please enter a valid email address';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading = false;
        this.cdr.markForCheck();
        // Navigate to home page after successful login
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;

        // Extract error message from different response formats
        let errorMsg = 'Login failed. Please try again.';

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
        if (err.status === 401 || errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('not found')) {
          this.error = 'Email or password is incorrect. Please try again or register a new account.';
        } else if (err.status === 400 || errorMsg.toLowerCase().includes('required')) {
          this.error = errorMsg;
        } else if (err.status === 500) {
          this.error = 'Server error. Please try again later.';
        } else if (err.status === 0) {
          this.error = 'Connection error. Please check your internet connection.';
        } else {
          this.error = errorMsg || 'Login failed. Please try again.';
        }

        this.cdr.markForCheck();
      }
    });
  }
}
