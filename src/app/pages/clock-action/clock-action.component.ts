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
      },
      error: (error) => {
        console.error("Erreur lors du chargement de l'utilisateur:", error);
        this.errorMessage.set(
          'Impossible de charger les informations utilisateur'
        );
      },
    });
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
          this.updateLocalState(action);
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
   * Mettre à jour l'état local après une action réussie
   */
  private updateLocalState(action: ClockAction): void {
    const now = Date.now();

    switch (action) {
      case 'clock_in':
        const clockIn = this.getCurrentTime();
        this.sessionData.sessions.push({ clockIn, clockOut: '' });
        this.sessionData.workStartTime = now;
        this.isWorkActive.set(true);
        this.isBreakActive.set(false);
        break;

      case 'clock_out':
        if (this.sessionData.workStartTime) {
          const elapsed = Math.floor(
            (now - this.sessionData.workStartTime) / 1000
          );
          this.sessionData.totalWorkSeconds += elapsed;
          this.workTime.set(this.sessionData.totalWorkSeconds);

          const clockOut = this.getCurrentTime();
          if (this.sessionData.sessions.length > 0) {
            const lastSession =
              this.sessionData.sessions[this.sessionData.sessions.length - 1];
            if (!lastSession.clockOut) {
              lastSession.clockOut = clockOut;
            }
          }
        }
        this.sessionData.workStartTime = null;
        this.isWorkActive.set(false);
        this.isBreakActive.set(false);
        break;

      case 'break_in':
        if (this.sessionData.workStartTime) {
          const elapsed = Math.floor(
            (now - this.sessionData.workStartTime) / 1000
          );
          this.sessionData.totalWorkSeconds += elapsed;
          this.workTime.set(this.sessionData.totalWorkSeconds);
        }
        this.sessionData.breakStartTime = now;
        this.isBreakActive.set(true);
        this.sessionData.workStartTime = null;
        break;

      case 'break_out':
        if (this.sessionData.breakStartTime) {
          const elapsed = Math.floor(
            (now - this.sessionData.breakStartTime) / 1000
          );
          this.sessionData.totalBreakSeconds += elapsed;
          this.breakTime.set(this.sessionData.totalBreakSeconds);
        }
        this.sessionData.breakStartTime = null;
        this.isBreakActive.set(false);
        this.sessionData.workStartTime = now;
        break;
    }

    this.saveSessionData();
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
    if (confirm('Êtes-vous sûr? Cela réinitialisera tous les temps du jour.')) {
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
