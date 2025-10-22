import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Shield, RotateCcw, Clock } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-two-factor-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './two-factor-auth.component.html',
  styleUrl: './two-factor-auth.component.css',
})
export class TwoFactorAuthComponent {
  readonly ShieldIcon = Shield;
  readonly RotateCcwIcon = RotateCcw;
  readonly ClockIcon = Clock;

  otpCode = signal('');
  isLoading = signal(false);
  errorMessage = signal('');
  remainingTime = signal(300); // 5 minutes
  isExpired = signal(false);

  constructor(private authService: AuthService, private router: Router) {
    this.startTimer();
  }

  onOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^\d]/g, '').slice(0, 6);
    this.otpCode.set(value);

    // Auto-submit when 6 digits
    if (value.length === 6) {
      this.onSubmit();
    }
  }

  onSubmit() {
    const code = this.otpCode();

    if (code.length !== 6) {
      this.errorMessage.set('Veuillez entrer les 6 chiffres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Mock API call
    setTimeout(() => {
      // Production: this.authService.verify2FA(code)
      if (code === '000000') {
        // Demo code
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set('Code incorrect. Veuillez réessayer.');
        this.isLoading.set(false);
        this.otpCode.set('');
      }
    }, 1000);
  }

  resendOtp() {
    this.otpCode.set('');
    this.errorMessage.set('');
    this.isExpired.set(false);
    this.remainingTime.set(300);
    this.startTimer();
    // Production: this.authService.resend2FA()
  }

  private startTimer() {
    const interval = setInterval(() => {
      const time = this.remainingTime();
      if (time > 0) {
        this.remainingTime.set(time - 1);
      } else {
        this.isExpired.set(true);
        clearInterval(interval);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }
}
