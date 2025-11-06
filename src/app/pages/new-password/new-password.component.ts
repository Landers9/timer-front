// src/app/pages/new-password/new-password.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-angular';
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
  readonly CheckCircleIcon = CheckCircle;

  newPassword = signal('');
  confirmPassword = signal('');
  password = signal(''); // Alias pour compatibilité template
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  showPassword = signal(false); // Alias pour compatibilité template
  isLoading = signal(false);
  errorMessage = signal('');
  passwordStrength = signal<'weak' | 'medium' | 'strong' | ''>('');

  // Password validation
  hasMinLength = computed(() => this.newPassword().length >= 8);
  hasUpperCase = computed(() => /[A-Z]/.test(this.newPassword()));
  hasLowerCase = computed(() => /[a-z]/.test(this.newPassword()));
  hasNumber = computed(() => /[0-9]/.test(this.newPassword()));
  hasSpecialChar = computed(() =>
    /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword())
  );

  isPasswordValid = computed(
    () =>
      this.hasMinLength() &&
      this.hasUpperCase() &&
      this.hasLowerCase() &&
      this.hasNumber() &&
      this.hasSpecialChar()
  );

  passwordsMatch = computed(
    () =>
      this.newPassword() === this.confirmPassword() &&
      this.confirmPassword().length > 0
  );

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Vérifier qu'on a un token de reset validé
    if (!this.authService.resetToken()) {
      this.router.navigate(['/forgot-password']);
    }
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword.update((val) => !val);
    this.showPassword.update((val) => !val); // Sync
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((val) => !val);
  }

  updatePasswordStrength() {
    const pwd = this.newPassword();
    this.password.set(pwd); // Sync avec alias

    if (!pwd) {
      this.passwordStrength.set('');
      return;
    }

    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;

    if (strength <= 2) {
      this.passwordStrength.set('weak');
    } else if (strength <= 4) {
      this.passwordStrength.set('medium');
    } else {
      this.passwordStrength.set('strong');
    }
  }

  onSubmit() {
    this.errorMessage.set('');

    if (!this.isPasswordValid()) {
      this.errorMessage.set('Le mot de passe ne respecte pas les critères');
      return;
    }

    if (!this.passwordsMatch()) {
      this.errorMessage.set('Les mots de passe ne correspondent pas');
      return;
    }

    this.isLoading.set(true);

    this.authService.confirmPasswordReset(this.newPassword()).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Rediriger vers login avec message de succès
        this.router.navigate(['/login'], {
          state: { message: 'Mot de passe réinitialisé avec succès' },
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.message || 'Erreur lors de la réinitialisation du mot de passe'
        );
      },
    });
  }
}
