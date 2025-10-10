// src/app/pages/login/login.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Clock, Mail, Lock, LogIn } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  // Icons
  readonly ClockIcon = Clock;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly LogInIcon = LogIn;

  email = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);
  showPassword = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Simulate login for demo
    setTimeout(() => {
      if (this.email() && this.password()) {
        // Mock successful login
        this.authService.currentUser.set({
          id: 1,
          firstName: 'John',
          lastName: 'Manager',
          email: this.email(),
          phoneNumber: '+33612345678',
          role: 'manager',
        });

        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage.set('Veuillez remplir tous les champs');
        this.isLoading.set(false);
      }
    }, 1000);

    /* Production code:
    this.authService.login(this.email(), this.password()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage.set('Email ou mot de passe incorrect');
        this.isLoading.set(false);
      },
    });
    */
  }

  togglePasswordVisibility() {
    this.showPassword.update((value) => !value);
  }
}
