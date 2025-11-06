// src/app/pages/login/login.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, Lock, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  togglePasswordVisibility() {
    this.showPassword.update((val) => !val);
  }

  onSubmit() {
    // Reset error
    this.errorMessage.set('');

    // Validation
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Veuillez remplir tous les champs');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email())) {
      this.errorMessage.set('Veuillez entrer un email valide');
      return;
    }

    this.isLoading.set(true);

    // Appel API Login
    this.authService.login(this.email(), this.password()).subscribe({
      next: (response) => {
        this.isLoading.set(false);

        if (response.requires_verification) {
          // Rediriger vers la page de vérification 2FA
          this.router.navigate(['/verify-2fa']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message || 'Erreur de connexion');
      },
    });
  }
}
