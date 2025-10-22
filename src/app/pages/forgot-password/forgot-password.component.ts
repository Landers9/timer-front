import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, ArrowLeft, Check } from 'lucide-angular';
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
  readonly CheckIcon = Check;

  email = signal('');
  isLoading = signal(false);
  isSubmitted = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Mock API call
    setTimeout(() => {
      if (this.email() && this.email().includes('@')) {
        this.isSubmitted.set(true);
        // Production: this.authService.requestPasswordReset(this.email())
      } else {
        this.errorMessage.set('Veuillez entrer une adresse email valide');
        this.isLoading.set(false);
      }
    }, 1000);
  }

  resend() {
    this.isSubmitted.set(false);
    this.email.set('');
  }
}
