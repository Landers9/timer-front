// src/app/pages/login/login.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email = signal('');
  password = signal('');
  errorMessage = signal('');
  isLoading = signal(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.email(), this.password()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage.set('Email ou mot de passe incorrect');
        this.isLoading.set(false);
      },
    });
  }
}
