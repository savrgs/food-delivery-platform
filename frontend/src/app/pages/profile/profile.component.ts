import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../services/auth.service';
import { ApiService } from '../../services/api';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  user: UserProfile | null = null;
  loading = true;
  
  // Profile edit
  editMode = false;
  profileForm = {
    name: '',
    email: ''
  };
  profileSaving = false;
  profileError = '';
  profileSuccess = '';

  // Password change
  showPasswordForm = false;
  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  passwordSaving = false;
  passwordError = '';
  passwordSuccess = '';

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        this.profileForm.name = profile.full_name || '';
        this.profileForm.email = profile.email;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ========== PROFILE EDIT ==========

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    this.profileError = '';
    this.profileSuccess = '';
    if (this.user) {
      this.profileForm.name = this.user.full_name || '';
      this.profileForm.email = this.user.email;
    }
  }

  saveProfile(): void {
    if (!this.profileForm.name.trim()) {
      this.profileError = 'Name is required';
      return;
    }

    this.profileSaving = true;
    this.profileError = '';
    this.profileSuccess = '';

    this.authService.updateProfile({ full_name: this.profileForm.name.trim() }).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.profileSuccess = 'Profile updated successfully!';
        this.editMode = false;
        this.profileSaving = false;
        this.toast.success('Profile updated successfully!');
        this.cdr.markForCheck();
        
        setTimeout(() => {
          this.profileSuccess = '';
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        this.profileError = err.error?.message || 'Failed to update profile';
        this.toast.error(this.profileError);
        this.profileSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ========== PASSWORD CHANGE ==========

  togglePasswordForm(): void {
    this.showPasswordForm = !this.showPasswordForm;
    this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
    this.passwordError = '';
    this.passwordSuccess = '';
  }

  changePassword(): void {
    // Validate
    if (!this.passwordForm.currentPassword) {
      this.passwordError = 'Current password is required';
      return;
    }
    if (this.passwordForm.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters';
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }

    this.passwordSaving = true;
    this.passwordError = '';
    this.passwordSuccess = '';

    this.api.changePassword(this.passwordForm.currentPassword, this.passwordForm.newPassword).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully!';
        this.showPasswordForm = false;
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        this.passwordSaving = false;
        this.toast.success('Password changed successfully!');
        this.cdr.markForCheck();

        setTimeout(() => {
          this.passwordSuccess = '';
          this.cdr.markForCheck();
        }, 3000);
      },
      error: (err) => {
        console.error('Failed to change password:', err);
        this.passwordError = err.error?.message || 'Failed to change password. Check your current password.';
        this.toast.error(this.passwordError);
        this.passwordSaving = false;
        this.cdr.markForCheck();
      }
    });
  }

  // ========== LOGOUT ==========

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
