import { Component, inject, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div class="toast toast-{{ toast.type }}" (click)="dismiss(toast.id)">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error') { ✕ }
              @case ('warning') { ⚠ }
              @case ('info') { ℹ }
            }
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" (click)="dismiss(toast.id); $event.stopPropagation()">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      flex-shrink: 0;
    }

    .toast-success .toast-icon {
      background: #dcfce7;
      color: #16a34a;
    }

    .toast-error .toast-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .toast-warning .toast-icon {
      background: #fef3c7;
      color: #d97706;
    }

    .toast-info .toast-icon {
      background: #dbeafe;
      color: #2563eb;
    }

    .toast-success {
      border-left: 4px solid #16a34a;
    }

    .toast-error {
      border-left: 4px solid #dc2626;
    }

    .toast-warning {
      border-left: 4px solid #d97706;
    }

    .toast-info {
      border-left: 4px solid #2563eb;
    }

    .toast-message {
      flex: 1;
      font-size: 14px;
      color: #374151;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 20px;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      line-height: 1;
      transition: color 0.2s;
    }

    .toast-close:hover {
      color: #374151;
    }

    @media (max-width: 480px) {
      .toast-container {
        left: 10px;
        right: 10px;
        max-width: none;
      }

      .toast {
        min-width: auto;
      }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private subscription?: Subscription;
  toasts: Toast[] = [];

  ngOnInit(): void {
    this.subscription = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  dismiss(id: number): void {
    this.toastService.remove(id);
  }
}
