// src/app/pages/clock-action/clock-action.component.ts
import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  ArrowLeft,
  Clock,
  Users,
  Settings,
} from 'lucide-angular';
import {
  ClockService,
  ClockAction,
  ClockLocation,
  ApiClockRecord,
} from '../../services/clock.service';
import { UserService } from '../../services/user.service';

interface SessionData {
  workStartTime: number | null;
  breakStartTime: number | null;
  totalWorkSeconds: number;
  totalBreakSeconds: number;
  isWorkActive: boolean;
  isBreakActive: boolean;
  sessions: { clockIn: string; clockOut: string }[];
  lastClockRecord: ApiClockRecord | null;
}

@Component({
  selector: 'app-clock-action',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './clock-action.component.html',
  styleUrl: './clock-action.component.css',
})
export class ClockActionComponent implements OnInit, OnDestroy {
  readonly PlayIcon = Play;
  readonly PauseIcon = Pause;
  readonly RotateCcwIcon = RotateCcw;
  readonly CoffeeIcon = Coffee;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ClockIcon = Clock;
  readonly UsersIcon = Users;
  readonly SettingsIcon = Settings;

  // State signals
  currentTime = signal('00:00');
  workTime = signal(0);
  breakTime = signal(0);
  isWorkActive = signal(false);
  isBreakActive = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentUserId = signal<string | null>(null);

  // Computed displays
  workDisplay = computed(() => this.formatTime(this.workTime()));
  breakDisplay = computed(() => this.formatTime(this.breakTime()));

  totalToday = computed(() => {
    const work = this.workTime();
    const breakTime = this.breakTime();
    const total = work + breakTime;
    return this.formatTime(total);
  });

  productivityPercent = computed(() => {
    const work = this.workTime();
    const breakTime = this.breakTime();
    const total = work + breakTime;
    if (total === 0) return 0;
    return Math.round((work / total) * 100);
  });

  statusMessage = computed(() => {
    if (this.isWorkActive()) return "You're on the clock.";
    if (this.isBreakActive()) return "You're on break.";
    return "You're off the clock.";
  });

  private timeInterval: any;
  private sessionKey = 'clockSession';
  private sessionData: SessionData = {
    workStartTime: null,
    breakStartTime: null,
    totalWorkSeconds: 0,
    totalBreakSeconds: 0,
    isWorkActive: false,
    isBreakActive: false,
    sessions: [],
    lastClockRecord: null,
  };

  constructor(
    private clockService: ClockService,
    private userService: UserService,
    private router: Router
  ) {
    this.loadSessionData();
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.updateTimers();
    this.timeInterval = setInterval(() => this.updateTimers(), 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.saveSessionData();
  }

  /**
   * Charger l'utilisateur connecté
   */
  private loadCurrentUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId.set(user.id);
        this.loadTodayClockStatus(user.id);
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
   * Charger le statut du clock d'aujourd'hui depuis l'API
   */
  private loadTodayClockStatus(userId: string): void {
    this.clockService.getUserClocks(userId).subscribe({
      next: (records) => {
        // Récupérer le dernier enregistrement d'aujourd'hui
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = records.filter((r) => {
          if (!r.clock_in_time) return false;
          const recordDate = new Date(r.clock_in_time)
            .toISOString()
            .split('T')[0];
          return recordDate === today;
        });

        if (todayRecords.length > 0) {
          const lastRecord = todayRecords[0];
          this.sessionData.lastClockRecord = lastRecord;
          this.syncStateWithApiRecord(lastRecord);
        }
      },
      error: (error) => {
        console.error('Erreur chargement statut clock:', error);
      },
    });
  }

  /**
   * Synchroniser l'état local avec un enregistrement API
   */
  private syncStateWithApiRecord(record: ApiClockRecord): void {
    const now = Date.now();

    // Clock In actif (pas de clock out)
    if (record.clock_in_time && !record.clock_out_time) {
      const clockInTime = new Date(record.clock_in_time).getTime();

      // Pause active (break_in sans break_out)
      if (record.break_in_time && !record.break_out_time) {
        const breakInTime = new Date(record.break_in_time).getTime();

        // Calculer le temps de travail jusqu'au début de la pause
        const workSeconds = Math.floor((breakInTime - clockInTime) / 1000);
        this.sessionData.totalWorkSeconds = workSeconds;
        this.workTime.set(workSeconds);

        // Pause en cours
        this.sessionData.breakStartTime = breakInTime;
        this.isBreakActive.set(true);
        this.isWorkActive.set(false);
        this.sessionData.isBreakActive = true;
        this.sessionData.isWorkActive = false;
      }
      // Travail actif (pas de pause ou pause terminée)
      else {
        let workStartTime = clockInTime;
        let totalBreakSeconds = 0;

        // Si une pause a été faite et terminée
        if (record.break_in_time && record.break_out_time) {
          const breakInTime = new Date(record.break_in_time).getTime();
          const breakOutTime = new Date(record.break_out_time).getTime();

          totalBreakSeconds = Math.floor((breakOutTime - breakInTime) / 1000);
          workStartTime = breakOutTime; // Reprendre depuis la fin de la pause

          // Calculer le travail avant la pause
          const workBeforeBreak = Math.floor(
            (breakInTime - clockInTime) / 1000
          );
          this.sessionData.totalWorkSeconds = workBeforeBreak;
        } else {
          this.sessionData.totalWorkSeconds = 0;
        }

        this.sessionData.workStartTime = workStartTime;
        this.sessionData.totalBreakSeconds = totalBreakSeconds;
        this.breakTime.set(totalBreakSeconds);
        this.isWorkActive.set(true);
        this.isBreakActive.set(false);
        this.sessionData.isWorkActive = true;
        this.sessionData.isBreakActive = false;
      }
    }
    // Clock Out fait (journée terminée)
    else if (record.clock_out_time) {
      this.isWorkActive.set(false);
      this.isBreakActive.set(false);
      this.sessionData.isWorkActive = false;
      this.sessionData.isBreakActive = false;
      this.sessionData.workStartTime = null;
      this.sessionData.breakStartTime = null;

      // Calculer les temps totaux
      const clockInTime = new Date(record.clock_in_time!).getTime();
      const clockOutTime = new Date(record.clock_out_time).getTime();

      let totalWork = Math.floor((clockOutTime - clockInTime) / 1000);
      let totalBreak = 0;

      if (record.break_in_time && record.break_out_time) {
        const breakInTime = new Date(record.break_in_time).getTime();
        const breakOutTime = new Date(record.break_out_time).getTime();
        totalBreak = Math.floor((breakOutTime - breakInTime) / 1000);
        totalWork -= totalBreak; // Soustraire la pause du temps de travail
      }

      this.sessionData.totalWorkSeconds = totalWork;
      this.sessionData.totalBreakSeconds = totalBreak;
      this.workTime.set(totalWork);
      this.breakTime.set(totalBreak);
    }

    this.saveSessionData();
  }

  private loadSessionData() {
    const stored = localStorage.getItem(this.sessionKey);
    if (stored) {
      this.sessionData = JSON.parse(stored);
      this.isWorkActive.set(this.sessionData.isWorkActive);
      this.isBreakActive.set(this.sessionData.isBreakActive);
      this.workTime.set(this.sessionData.totalWorkSeconds);
      this.breakTime.set(this.sessionData.totalBreakSeconds);
    }
  }

  private saveSessionData() {
    this.sessionData.totalWorkSeconds = this.workTime();
    this.sessionData.totalBreakSeconds = this.breakTime();
    this.sessionData.isWorkActive = this.isWorkActive();
    this.sessionData.isBreakActive = this.isBreakActive();
    localStorage.setItem(this.sessionKey, JSON.stringify(this.sessionData));
  }

  private updateTimers() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.currentTime.set(`${hours}:${minutes}`);

    const timestamp = Date.now();

    if (this.isWorkActive() && this.sessionData.workStartTime) {
      const elapsed = Math.floor(
        (timestamp - this.sessionData.workStartTime) / 1000
      );
      this.workTime.set(this.sessionData.totalWorkSeconds + elapsed);
    }

    if (this.isBreakActive() && this.sessionData.breakStartTime) {
      const elapsed = Math.floor(
        (timestamp - this.sessionData.breakStartTime) / 1000
      );
      this.breakTime.set(this.sessionData.totalBreakSeconds + elapsed);
    }

    this.saveSessionData();
  }

  /**
   * Effectuer une action de clock via l'API
   */
  private async performClockAction(action: ClockAction): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const location: ClockLocation =
        await this.clockService.getCurrentLocation();

      this.clockService.clockAction(action, location).subscribe({
        next: (response) => {
          console.log('Clock action réussie:', response);
          this.isLoading.set(false);

          // Synchroniser immédiatement avec la réponse API
          this.sessionData.lastClockRecord = response;
          this.syncStateWithApiRecord(response);

          // Message de succès
          this.showSuccessMessage(action);
        },
        error: (error) => {
          console.error('Erreur clock action:', error);
          this.errorMessage.set(error.message);
          this.isLoading.set(false);
        },
      });
    } catch (error: any) {
      console.error('Erreur de géolocalisation:', error);
      this.errorMessage.set(error.message || 'Erreur de géolocalisation');
      this.isLoading.set(false);
    }
  }

  /**
   * Afficher un message de succès temporaire
   */
  private showSuccessMessage(action: ClockAction): void {
    const messages: Record<ClockAction, string> = {
      clock_in: "Pointage d'arrivée enregistré !",
      clock_out: 'Pointage de départ enregistré !',
      break_in: 'Pause commencée',
      break_out: 'Pause terminée',
    };

    const message = messages[action];
    this.errorMessage.set(`✓ ${message}`);

    setTimeout(() => {
      if (this.errorMessage() === `✓ ${message}`) {
        this.errorMessage.set(null);
      }
    }, 3000);
  }

  toggleWork() {
    if (this.isLoading()) return;

    if (this.isWorkActive()) {
      this.performClockAction('clock_out');
    } else {
      this.performClockAction('clock_in');
    }
  }

  toggleBreak() {
    if (!this.isWorkActive() || this.isLoading()) return;

    if (this.isBreakActive()) {
      this.performClockAction('break_out');
    } else {
      this.performClockAction('break_in');
    }
  }

  resetDay() {
    if (
      confirm(
        'Êtes-vous sûr? Cela réinitialisera tous les temps du jour localement.'
      )
    ) {
      this.workTime.set(0);
      this.breakTime.set(0);
      this.isWorkActive.set(false);
      this.isBreakActive.set(false);
      this.sessionData = {
        workStartTime: null,
        breakStartTime: null,
        totalWorkSeconds: 0,
        totalBreakSeconds: 0,
        isWorkActive: false,
        isBreakActive: false,
        sessions: [],
        lastClockRecord: null,
      };
      this.saveSessionData();
    }
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  }

  goBack() {
    this.router.navigate(['/clock']);
  }

  dismissError() {
    this.errorMessage.set(null);
  }
}
