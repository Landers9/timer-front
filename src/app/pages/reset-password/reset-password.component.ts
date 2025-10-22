import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly CheckIcon = Check;
  readonly AlertIcon = AlertCircle;

  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal('');
  token = signal('');
  isInvalidToken = signal(false);

  // Password strength indicator
  passwordStrength = signal<'weak' | 'medium' | 'strong'>('weak');

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get token from URL params
    this.route.queryParams.subscribe((params) => {
      this.token.set(params['token'] || '');
      if (!this.token()) {
        this.isInvalidToken.set(true);
      }
    });
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

    // Mock API call
    setTimeout(() => {
      this.isSubmitted.set(true);
      // Production: this.authService.resetPassword(this.token(), this.password())
    }, 1000);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
