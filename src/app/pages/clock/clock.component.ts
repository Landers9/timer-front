// src/app/pages/clock/clock.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Clock as ClockIcon, Plus } from 'lucide-angular';
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
   * Charger l'historique des clocks depuis l'API
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

    // Formater la date
    const date = clockInTime
      ? clockInTime.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'N/A';

    // Formater les heures
    const formatTime = (date: Date | null): string => {
      if (!date) return '--:--';
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const clockInTimeStr = formatTime(clockInTime);
    const clockOutTimeStr = formatTime(clockOutTime);
    const breakInTimeStr = formatTime(breakInTime);
    const breakOutTimeStr = formatTime(breakOutTime);

    // Calculer les heures totales
    let totalHours = '00:00';
    let status: 'completed' | 'in-progress' = 'in-progress';

    if (clockInTime && clockOutTime) {
      const totalMs = clockOutTime.getTime() - clockInTime.getTime();

      // Soustraire la durée de pause si elle existe
      let breakMs = 0;
      if (breakInTime && breakOutTime) {
        breakMs = breakOutTime.getTime() - breakInTime.getTime();
      }

      const workMs = totalMs - breakMs;
      const hours = Math.floor(workMs / (1000 * 60 * 60));
      const minutes = Math.floor((workMs % (1000 * 60 * 60)) / (1000 * 60));

      totalHours = `${String(hours).padStart(2, '0')}:${String(
        minutes
      ).padStart(2, '0')}`;
      status = 'completed';
    } else if (clockInTime) {
      // Calcul en temps réel pour les sessions en cours
      const now = new Date();
      let currentWorkMs = now.getTime() - clockInTime.getTime();

      // Soustraire la pause en cours ou terminée
      if (breakInTime) {
        const breakEndTime = breakOutTime || now;
        const breakMs = breakEndTime.getTime() - breakInTime.getTime();
        currentWorkMs -= breakMs;
      }

      const hours = Math.floor(currentWorkMs / (1000 * 60 * 60));
      const minutes = Math.floor(
        (currentWorkMs % (1000 * 60 * 60)) / (1000 * 60)
      );

      totalHours = `${String(hours).padStart(2, '0')}:${String(
        minutes
      ).padStart(2, '0')}`;
      status = 'in-progress';
    }

    return {
      id: record.id,
      date,
      clockInTime: clockInTimeStr,
      clockOutTime: clockOutTimeStr,
      breakInTime: breakInTimeStr,
      breakOutTime: breakOutTimeStr,
      totalHours,
      status,
    };
  }

  /**
   * Naviguer vers la page d'action de clock
   */
  goToClockAction(): void {
    this.router.navigate(['/clock-action']);
  }

  /**
   * Rafraîchir l'historique
   */
  refreshHistory(): void {
    const userId = this.currentUserId();
    if (userId) {
      this.loadClockHistory(userId);
    }
  }

  /**
   * Fermer le message d'erreur
   */
  dismissError(): void {
    this.errorMessage.set(null);
  }

  /**
   * Obtenir la classe CSS du badge de statut
   */
  getStatusBadgeClass(status: 'completed' | 'in-progress'): string {
    return status === 'completed' ? 'badge-success' : 'badge-warning';
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status: 'completed' | 'in-progress'): string {
    return status === 'completed' ? 'Completed' : 'In Progress';
  }
}
