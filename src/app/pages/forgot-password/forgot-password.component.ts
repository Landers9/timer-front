// src/app/pages/forgot-password/forgot-password.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, ArrowLeft } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  readonly MailIcon = Mail;
  readonly ArrowLeftIcon = ArrowLeft;

  email = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.errorMessage.set('');

    if (!this.email()) {
      this.errorMessage.set('Veuillez entrer votre adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.errorMessage.set('Veuillez entrer un email valide');
      return;
    }

    this.isLoading.set(true);

    this.authService.requestPasswordReset(this.email()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Rediriger vers la page de vérification du code
        this.router.navigate(['/verify-reset-code']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.message || "Erreur lors de l'envoi du code"
        );
      },
    });
  }
}
