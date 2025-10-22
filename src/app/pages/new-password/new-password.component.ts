// src/app/pages/new-password/new-password.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Lock, Eye, EyeOff } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.css',
})
export class NewPasswordComponent implements OnInit {
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');
  passwordStrength = signal<'weak' | 'medium' | 'strong'>('weak');

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.authService.sessionId()) {
      this.router.navigate(['/forgot-password']);
    }
  }

  updatePasswordStrength() {
    const pwd = this.password();
    if (pwd.length < 8) {
      this.passwordStrength.set('weak');
    } else if (pwd.length < 12 || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
      this.passwordStrength.set('medium');
    } else {
      this.passwordStrength.set('strong');
    }
  }

  onSubmit() {
    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.password().length < 8) {
      this.errorMessage.set(
        'Le mot de passe doit contenir au moins 8 caractères'
      );
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .resetPassword(this.password(), this.authService.sessionId()!)
      .subscribe({
        next: () => {
          this.authService.sessionId.set(null);
          this.router.navigate(['/login']);
        },
        error: () => {
          this.errorMessage.set('Erreur lors de la réinitialisation');
          this.isLoading.set(false);
        },
      });
  }
}
