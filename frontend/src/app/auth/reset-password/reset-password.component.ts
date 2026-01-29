import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  password = '';
  confirmPassword = '';
  loading = false;
  validating = true;
  error = '';
  token = '';
  tokenValid = false;
  resetComplete = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      if (this.token) {
        this.validateToken();
      } else {
        this.validating = false;
        this.tokenValid = false;
      }
    });
  }

  validateToken(): void {
    this.validating = true;
    console.log('Validating token:', this.token);
    this.authService.validateResetToken(this.token).subscribe({
      next: (response) => {
        console.log('Validation response:', response);
        this.tokenValid = response.valid;
        this.validating = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Validation error:', err);
        this.tokenValid = false;
        this.validating = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (!this.password || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.resetComplete = true;
        this.toast.success('Password reset successful!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Failed to reset password. Please try again.';
        this.toast.error(this.error);
        this.cdr.detectChanges();
      }
    });
  }
}
