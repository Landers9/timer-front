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
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.requestPasswordReset(this.email()).subscribe({
      next: (response) => {
        this.authService.sessionId.set(response.resetSessionId);
        this.router.navigate(['/verify-reset-code']);
      },
      error: () => {
        this.errorMessage.set('Email non trouvé');
        this.isLoading.set(false);
      },
    });
  }
}
