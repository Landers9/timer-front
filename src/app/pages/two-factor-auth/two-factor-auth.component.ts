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
  isResending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Vérifier qu'on a un token de vérification
    if (!this.authService.verificationToken()) {
      this.router.navigate(['/login']);
    }
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^\d]/g, '').slice(0, 6);
    this.otpCode.set(value);
    this.errorMessage.set('');
  }

  onSubmit() {
    const code = this.otpCode();

    if (code.length !== 6) {
      this.errorMessage.set('Veuillez entrer les 6 chiffres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.verifyLoginCode(code).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Rediriger vers le dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage.set(
          error.message || 'Code incorrect. Veuillez réessayer.'
        );
        this.isLoading.set(false);
        this.otpCode.set('');
      },
    });
  }

  resendCode() {
    this.isResending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.resendLoginCode().subscribe({
      next: (response) => {
        this.isResending.set(false);
        this.successMessage.set('Un nouveau code a été envoyé à votre email');
        this.otpCode.set('');

        // Effacer le message de succès après 3 secondes
        setTimeout(() => {
          this.successMessage.set('');
        }, 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Erreur lors du renvoi du code');
        this.isResending.set(false);
      },
    });
  }

  // Alias pour compatibilité template
  resendOtp() {
    this.resendCode();
  }
}
