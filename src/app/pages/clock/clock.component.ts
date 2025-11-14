// src/app/pages/clock/clock.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Clock as ClockIcon,
  Plus,
  Calendar,
  TrendingUp,
} from 'lucide-angular';
import { ClockService, ApiClockRecord } from '../../services/clock.service';
import { UserService } from '../../services/user.service';

interface ClockHistoryDisplay {
  id: string;
  date: string;
  clockInTime: string;
  clockOutTime: string;
  breakInTime: string;
  breakOutTime: string;
  totalHours: string;
  status: 'completed' | 'in-progress';
}

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './clock.component.html',
  styleUrl: './clock.component.css',
})
export class ClockComponent implements OnInit {
  readonly ClockIcon = ClockIcon;
  readonly PlusIcon = Plus;

  // Data
  clockHistory = signal<ClockHistoryDisplay[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentUserId = signal<string | null>(null);

  constructor(
    private clockService: ClockService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /**
   * Charger l'utilisateur connecté et son historique
   */
  private loadCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId.set(user.id);
        this.loadClockHistory(user.id);
      },
      error: (error) => {
        console.error("Erreur lors du chargement de l'utilisateur:", error);
        this.errorMessage.set(
          'Impossible de charger les informations utilisateur'
        );
      },
    });
  }

  /**
   * Charger l'historique des clocks
   */
  loadClockHistory(userId: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.clockService.getUserClocks(userId).subscribe({
      next: (records) => {
        const displayRecords = records.map(this.mapApiClockToDisplay);
        this.clockHistory.set(displayRecords);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error("Erreur lors du chargement de l'historique:", error);
        this.errorMessage.set(
          error.message || "Erreur lors du chargement de l'historique"
        );
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Mapper ApiClockRecord vers ClockHistoryDisplay
   */
  private mapApiClockToDisplay(record: ApiClockRecord): ClockHistoryDisplay {
    const clockInTime = record.clock_in_time
      ? new Date(record.clock_in_time)
      : null;
    const clockOutTime = record.clock_out_time
      ? new Date(record.clock_out_time)
      : null;
    const breakInTime = record.break_in_time
      ? new Date(record.break_in_time)
      : null;
    const breakOutTime = record.break_out_time
      ? new Date(record.break_out_time)
      : null;

    let totalHours = '0h 0m';
    let status: 'completed' | 'in-progress' = 'in-progress';

    if (clockInTime && clockOutTime) {
      const diffMs = clockOutTime.getTime() - clockInTime.getTime();

      // Soustraire le temps de pause si présent
      let breakMs = 0;
      if (breakInTime && breakOutTime) {
        breakMs = breakOutTime.getTime() - breakInTime.getTime();
      }

      const totalMs = diffMs - breakMs;
      const hours = Math.floor(totalMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      totalHours = `${hours}h ${minutes}m`;
      status = 'completed';
    }

    return {
      id: record.id,
      date: clockInTime ? clockInTime.toLocaleDateString('fr-FR') : 'N/A',
      clockInTime: clockInTime ? this.formatTime(clockInTime) : 'N/A',
      clockOutTime: clockOutTime ? this.formatTime(clockOutTime) : 'En cours',
      breakInTime: breakInTime ? this.formatTime(breakInTime) : 'N/A',
      breakOutTime: breakOutTime ? this.formatTime(breakOutTime) : 'N/A',
      totalHours,
      status,
    };
  }

  /**
   * Aller vers la page d'action clock
   */
  goToClockAction(): void {
    this.router.navigate(['/clock/action']);
  }

  /**
   * Retourner au dashboard
   */
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Formater une date en heure (HH:MM)
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Parser une date depuis une string
   */
  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(
        parseInt(parts[2]),
        parseInt(parts[1]) - 1,
        parseInt(parts[0])
      );
    }
    return new Date(dateStr);
  }

  /**
   * Convertir "Xh Ym" en secondes
   */
  private parseTimeToSeconds(timeStr: string): number {
    const hoursMatch = timeStr.match(/(\d+)h/);
    const minutesMatch = timeStr.match(/(\d+)m/);

    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    return hours * 3600 + minutes * 60;
  }

  /**
   * Convertir des secondes en "Xh Ym"
   */
  private formatSecondsToHours(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  /**
   * Obtenir la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    return status === 'completed' ? 'badge-success' : 'badge-warning';
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status: string): string {
    return status === 'completed' ? 'Terminé' : 'En cours';
  }
}
