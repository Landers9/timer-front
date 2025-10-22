// src/app/pages/two-factor-auth/two-factor-auth.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Shield, RotateCcw } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-two-factor-auth',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './two-factor-auth.component.html',
  styleUrl: './two-factor-auth.component.css',
})
export class TwoFactorAuthComponent implements OnInit {
  readonly ShieldIcon = Shield;
  readonly RotateCcwIcon = RotateCcw;

  otpCode = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.authService.sessionId()) {
      this.router.navigate(['/login']);
    }
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^\d]/g, '').slice(0, 6);
    this.otpCode.set(value);
  }

  onSubmit() {
    const code = this.otpCode();

    if (code.length !== 6) {
      this.errorMessage.set('Veuillez entrer les 6 chiffres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.verify2FA(code).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage.set('Code incorrect. Veuillez réessayer.');
        this.isLoading.set(false);
        this.otpCode.set('');
      },
    });
  }

  resendOtp() {
    this.isLoading.set(true);
    this.authService.resend2FA().subscribe({
      next: () => {
        this.otpCode.set('');
        this.errorMessage.set('');
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Erreur lors du renvoi du code');
        this.isLoading.set(false);
      },
    });
  }
}
