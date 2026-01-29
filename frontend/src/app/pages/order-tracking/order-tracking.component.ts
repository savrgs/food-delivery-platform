import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, OrderDetail } from '../../services/api';
import { ToastService } from '../../services/toast.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-tracking.component.html',
  styleUrl: './order-tracking.component.css'
})
export class OrderTrackingComponent implements OnInit, OnDestroy {
  order: OrderDetail | null = null;
  loading = true;
  error = '';
  
  // ETA countdown
  etaMinutes = 0;
  etaSeconds = 0;
  etaUpdatedAt: Date | null = null;
  
  // Simulation
  simulatedStatus: string | null = null;
  simulationStartTime: Date | null = null;
  totalSimulationMinutes = 0;
  
  private refreshSubscription?: Subscription;
  private countdownSubscription?: Subscription;

  // Status progression
  readonly statusSteps = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  readonly statusLabels: { [key: string]: string } = {
    'PENDING': 'Order Placed',
    'CONFIRMED': 'Confirmed',
    'PREPARING': 'Preparing',
    'OUT_FOR_DELIVERY': 'On the Way',
    'DELIVERED': 'Delivered',
    'CANCELLED': 'Cancelled'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'Invalid order ID';
      this.loading = false;
      return;
    }

    this.loadOrder(id);

    // Refresh order status every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      if (this.order && !this.isCompleted) {
        this.loadOrder(this.order.id, true);
      }
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
    this.countdownSubscription?.unsubscribe();
  }

  loadOrder(id: number, silent = false): void {
    if (!silent) this.loading = true;

    this.api.getOrder(id).subscribe({
      next: (order) => {
        this.order = order;
        // Only start simulation on initial load, not on refreshes
        if (!silent && !this.simulationStartTime) {
          this.startSimulation();
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load order:', err);
        this.error = 'Failed to load order details';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  startSimulation(): void {
    if (!this.order) return;
    
    // Don't start simulation if order is already completed in database
    const dbStatus = this.order.status;
    if (dbStatus === 'DELIVERED' || dbStatus === 'CANCELLED') {
      this.simulatedStatus = dbStatus;
      return;
    }
    
    // Don't restart if simulation is already running
    if (this.simulationStartTime) return;
    
    // Use the order's estimated delivery time for simulation
    // For demo: compress time so 1 real second = 1 simulated minute
    this.totalSimulationMinutes = this.order.estimated_delivery_minutes || 30;
    this.simulationStartTime = new Date();
    this.simulatedStatus = 'CONFIRMED'; // Start as confirmed
    
    // Update every second (each second = 1 minute in simulation)
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.updateSimulation();
    });
    
    this.updateSimulation();
  }

  updateSimulation(): void {
    if (!this.simulationStartTime || !this.order) return;
    
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - this.simulationStartTime.getTime()) / 1000);
    const remainingMinutes = Math.max(0, this.totalSimulationMinutes - elapsedSeconds);
    
    this.etaMinutes = remainingMinutes;
    this.etaSeconds = 0;
    
    // Update status based on remaining time (proportional to total time)
    // Example for 40 min delivery:
    // 100%-85% remaining (40-34 min): CONFIRMED
    // 85%-40% remaining (34-16 min): PREPARING  
    // 40%-0% remaining (16-0 min): OUT_FOR_DELIVERY
    // 0: DELIVERED
    
    const totalTime = this.totalSimulationMinutes;
    const prepareThreshold = totalTime * 0.85;  // Start preparing at 85% time remaining
    const deliveryThreshold = totalTime * 0.40; // Out for delivery at 40% time remaining
    
    if (remainingMinutes <= 0) {
      this.simulatedStatus = 'DELIVERED';
      this.countdownSubscription?.unsubscribe();
      this.markOrderDelivered();
    } else if (remainingMinutes <= deliveryThreshold) {
      if (this.simulatedStatus !== 'OUT_FOR_DELIVERY') {
        this.toast.info('Your order is on the way!');
      }
      this.simulatedStatus = 'OUT_FOR_DELIVERY';
    } else if (remainingMinutes <= prepareThreshold) {
      if (this.simulatedStatus !== 'PREPARING') {
        this.toast.info('Restaurant is preparing your order!');
      }
      this.simulatedStatus = 'PREPARING';
    } else {
      this.simulatedStatus = 'CONFIRMED';
    }
    
    this.cdr.markForCheck();
  }

  // Get the effective status (simulated or real)
  get effectiveStatus(): string {
    return this.simulatedStatus || this.order?.status || 'PENDING';
  }

  updateETA(): void {
    if (!this.order) return;
    
    // Parse ETA from order (backend returns estimated_delivery_minutes)
    if (this.order.estimated_delivery_minutes) {
      // Calculate remaining time based on when status changed
      const orderTime = new Date(this.order.updated_at || this.order.created_at);
      const now = new Date();
      const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);
      this.etaMinutes = Math.max(0, Math.round(this.order.estimated_delivery_minutes - elapsedMinutes));
      this.etaUpdatedAt = now;
    }
  }

  get isCompleted(): boolean {
    // Check both simulated and actual database status
    const status = this.effectiveStatus;
    const dbStatus = this.order?.status;
    return status === 'DELIVERED' || status === 'CANCELLED' || 
           dbStatus === 'DELIVERED' || dbStatus === 'CANCELLED';
  }

  get isCancelled(): boolean {
    return this.effectiveStatus === 'CANCELLED';
  }

  get currentStepIndex(): number {
    const idx = this.statusSteps.indexOf(this.effectiveStatus);
    return idx >= 0 ? idx : 0;
  }

  getStepClass(step: string): string {
    const status = this.effectiveStatus;
    if (status === 'CANCELLED') return 'cancelled';
    
    const currentIdx = this.statusSteps.indexOf(status);
    const stepIdx = this.statusSteps.indexOf(step);
    
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'pending';
  }

  formatPrice(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  get totalPrice(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0);
  }

  cancelOrder(): void {
    if (!this.order) return;
    
    if (confirm('Are you sure you want to cancel this order?')) {
      this.api.cancelOrder(this.order.id).subscribe({
        next: () => {
          this.toast.success('Order cancelled successfully');
          this.loadOrder(this.order!.id);
        },
        error: (err) => {
          console.error('Failed to cancel order:', err);
          this.toast.error('Failed to cancel order. It may have already been processed.');
        }
      });
    }
  }

  markOrderDelivered(): void {
    if (!this.order) {
      console.log('markOrderDelivered: no order');
      return;
    }
    
    console.log('markOrderDelivered: updating order', this.order.id, 'to DELIVERED');
    
    this.api.updateOrderStatus(this.order.id, 'DELIVERED').subscribe({
      next: (response) => {
        console.log('markOrderDelivered: success', response);
        this.toast.success('Your order has been delivered!');
        if (this.order) {
          this.order.status = 'DELIVERED';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('markOrderDelivered: error', err);
        // Still show delivered in UI even if backend update fails
        this.toast.success('Your order has been delivered!');
        if (this.order) {
          this.order.status = 'DELIVERED';
        }
        this.cdr.markForCheck();
      }
    });
  }

  goToOrders(): void {
    this.router.navigate(['/orders']);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
