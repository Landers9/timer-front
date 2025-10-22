// src/app/pages/verify-reset-code/verify-reset-code.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Shield } from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-reset-code',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './verify-reset-code.component.html',
  styleUrl: './verify-reset-code.component.css',
})
export class VerifyResetCodeComponent implements OnInit {
  readonly ShieldIcon = Shield;

  resetCode = signal('');
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.authService.sessionId()) {
      this.router.navigate(['/forgot-password']);
    }
  }

  onCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^\d]/g, '').slice(0, 6);
    this.resetCode.set(value);
  }

  onSubmit() {
    const code = this.resetCode();

    if (code.length !== 6) {
      this.errorMessage.set('Veuillez entrer les 6 chiffres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .verifyResetCode(code, this.authService.sessionId()!)
      .subscribe({
        next: () => {
          this.router.navigate(['/new-password']);
        },
        error: () => {
          this.errorMessage.set('Code incorrect. Veuillez réessayer.');
          this.isLoading.set(false);
          this.resetCode.set('');
        },
      });
  }
}
