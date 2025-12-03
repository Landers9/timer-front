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
  ClockState,
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

  // NOUVEAU: Signal pour l'état du clock
  clockState = signal<ClockState>(ClockState.NO_SESSION);

  // NOUVEAU: Computed pour savoir si le break est disponible
  // Le break n'est disponible que si on est en état WORKING (pas encore de pause)
  canStartBreak = computed(() => {
    return this.clockState() === ClockState.WORKING;
  });

  // NOUVEAU: Computed pour savoir si on peut faire un break_out
  canEndBreak = computed(() => {
    return this.clockState() === ClockState.ON_BREAK;
  });

  // NOUVEAU: Computed pour savoir si la section break doit être affichée
  // Afficher si: WORKING (peut démarrer une pause) ou ON_BREAK (en pause)
  showBreakSection = computed(() => {
    const state = this.clockState();
    return state === ClockState.WORKING || state === ClockState.ON_BREAK;
  });

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
    const state = this.clockState();
    switch (state) {
      case ClockState.WORKING:
        return "You're on the clock.";
      case ClockState.ON_BREAK:
        return "You're on break.";
      case ClockState.BACK_FROM_BREAK:
        return "You're back from break.";
      case ClockState.DAY_COMPLETED:
        return 'Day completed.';
      default:
        return "You're off the clock.";
    }
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
    this.loadCurrentClockStatus();
    this.updateTimers();
    this.timeInterval = setInterval(() => this.updateTimers(), 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    this.saveSessionData();
  }

  /**
   * Charger le statut actuel du clock via la nouvelle API
   */
  private loadCurrentClockStatus(): void {
    this.isLoading.set(true);

    this.clockService.getCurrentClock().subscribe({
      next: (record) => {
        this.isLoading.set(false);

        if (record) {
          this.sessionData.lastClockRecord = record;
          this.syncStateWithApiRecord(record);
        } else {
          // Pas de session active
          this.clockState.set(ClockState.NO_SESSION);
          this.resetLocalState();
        }
      },
      error: (error) => {
        console.error('Erreur chargement statut clock:', error);
        this.isLoading.set(false);
        // En cas d'erreur, essayer de charger depuis localStorage
        this.loadSessionData();
      },
    });
  }

  /**
   * Réinitialiser l'état local
   */
  private resetLocalState(): void {
    this.isWorkActive.set(false);
    this.isBreakActive.set(false);
    this.workTime.set(0);
    this.breakTime.set(0);
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

  /**
   * Synchroniser l'état local avec un enregistrement API
   */
  private syncStateWithApiRecord(record: ApiClockRecord): void {
    const now = Date.now();

    // Déterminer l'état via le service
    const state = this.clockService.determineClockState(record);
    this.clockState.set(state);

    switch (state) {
      case ClockState.NO_SESSION:
      case ClockState.DAY_COMPLETED:
        // Pas de session active ou journée terminée
        this.isWorkActive.set(false);
        this.isBreakActive.set(false);
        this.sessionData.isWorkActive = false;
        this.sessionData.isBreakActive = false;
        this.sessionData.workStartTime = null;
        this.sessionData.breakStartTime = null;

        if (
          state === ClockState.DAY_COMPLETED &&
          record.clock_in_time &&
          record.clock_out_time
        ) {
          // Calculer les temps totaux de la journée
          const clockInTime = new Date(record.clock_in_time).getTime();
          const clockOutTime = new Date(record.clock_out_time).getTime();

          let totalWork = Math.floor((clockOutTime - clockInTime) / 1000);
          let totalBreak = 0;

          if (record.break_in_time && record.break_out_time) {
            const breakInTime = new Date(record.break_in_time).getTime();
            const breakOutTime = new Date(record.break_out_time).getTime();
            totalBreak = Math.floor((breakOutTime - breakInTime) / 1000);
            totalWork -= totalBreak;
          }

          this.sessionData.totalWorkSeconds = totalWork;
          this.sessionData.totalBreakSeconds = totalBreak;
          this.workTime.set(totalWork);
          this.breakTime.set(totalBreak);
        }
        break;

      case ClockState.WORKING:
        // Travail en cours, pas de pause
        const clockInTime = new Date(record.clock_in_time!).getTime();
        this.sessionData.workStartTime = clockInTime;
        this.sessionData.totalWorkSeconds = 0;
        this.sessionData.totalBreakSeconds = 0;
        this.isWorkActive.set(true);
        this.isBreakActive.set(false);
        this.sessionData.isWorkActive = true;
        this.sessionData.isBreakActive = false;
        break;

      case ClockState.ON_BREAK:
        // En pause
        const clockInTimeBreak = new Date(record.clock_in_time!).getTime();
        const breakInTime = new Date(record.break_in_time!).getTime();

        // Calculer le temps de travail jusqu'au début de la pause
        const workSeconds = Math.floor((breakInTime - clockInTimeBreak) / 1000);
        this.sessionData.totalWorkSeconds = workSeconds;
        this.workTime.set(workSeconds);

        // Pause en cours
        this.sessionData.breakStartTime = breakInTime;
        this.isBreakActive.set(true);
        this.isWorkActive.set(false);
        this.sessionData.isBreakActive = true;
        this.sessionData.isWorkActive = false;
        break;

      case ClockState.BACK_FROM_BREAK:
        // Retour de pause - travail en cours, plus de break possible
        const clockInTimeBack = new Date(record.clock_in_time!).getTime();
        const breakInTimeBack = new Date(record.break_in_time!).getTime();
        const breakOutTime = new Date(record.break_out_time!).getTime();

        const totalBreakSeconds = Math.floor(
          (breakOutTime - breakInTimeBack) / 1000
        );
        const workBeforeBreak = Math.floor(
          (breakInTimeBack - clockInTimeBack) / 1000
        );

        this.sessionData.totalBreakSeconds = totalBreakSeconds;
        this.breakTime.set(totalBreakSeconds);

        // Reprendre depuis la fin de la pause
        this.sessionData.workStartTime = breakOutTime;
        this.sessionData.totalWorkSeconds = workBeforeBreak;

        this.isWorkActive.set(true);
        this.isBreakActive.set(false);
        this.sessionData.isWorkActive = true;
        this.sessionData.isBreakActive = false;
        break;
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
    const state = this.clockState();

    // Mise à jour du timer de travail
    if (
      (state === ClockState.WORKING || state === ClockState.BACK_FROM_BREAK) &&
      this.sessionData.workStartTime
    ) {
      const elapsed = Math.floor(
        (timestamp - this.sessionData.workStartTime) / 1000
      );
      this.workTime.set(this.sessionData.totalWorkSeconds + elapsed);
    }

    // Mise à jour du timer de pause
    if (state === ClockState.ON_BREAK && this.sessionData.breakStartTime) {
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

    const state = this.clockState();

    // Si on est en pause, on ne peut pas faire clock_out directement
    if (state === ClockState.ON_BREAK) {
      this.errorMessage.set(
        'Veuillez terminer votre pause avant de pointer la sortie.'
      );
      return;
    }

    // Si on travaille (WORKING ou BACK_FROM_BREAK), on fait clock_out
    if (state === ClockState.WORKING || state === ClockState.BACK_FROM_BREAK) {
      this.performClockAction('clock_out');
    }
    // Sinon (NO_SESSION ou DAY_COMPLETED), on fait clock_in
    else {
      this.performClockAction('clock_in');
    }
  }

  toggleBreak() {
    if (this.isLoading()) return;

    const state = this.clockState();

    // Vérifier si le break est possible
    if (state === ClockState.ON_BREAK) {
      // Terminer la pause
      this.performClockAction('break_out');
    } else if (state === ClockState.WORKING) {
      // Démarrer une pause (seulement si pas encore de pause)
      this.performClockAction('break_in');
    } else if (state === ClockState.BACK_FROM_BREAK) {
      // Déjà eu une pause, ne rien faire
      this.errorMessage.set('Une seule pause est autorisée par session.');
      setTimeout(() => {
        if (
          this.errorMessage() === 'Une seule pause est autorisée par session.'
        ) {
          this.errorMessage.set(null);
        }
      }, 3000);
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
      this.clockState.set(ClockState.NO_SESSION);
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
