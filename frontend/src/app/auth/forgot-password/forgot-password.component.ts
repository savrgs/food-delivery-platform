import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  email = '';
  loading = false;
  error = '';
  emailSent = false;
  resetToken = '';

  onSubmit(): void {
    if (!this.email) {
      this.error = 'Please enter your email address';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        console.log('Response received:', response);
        this.loading = false;
        this.emailSent = true;
        this.resetToken = response.resetToken || '';
        if (this.resetToken) {
          this.toast.info('Demo mode: Use the link below to reset your password');
        } else {
          this.toast.success('Password reset link sent to your email!');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.log('Error received:', err);
        this.loading = false;
        this.emailSent = true;
        this.toast.info('If an account exists with this email, you will receive a reset link.');
        this.cdr.detectChanges();
      }
    });
  }
}
