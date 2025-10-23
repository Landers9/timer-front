// src/app/pages/clock/clock.component.ts
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
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

interface SessionData {
  workStartTime: number | null;
  breakStartTime: number | null;
  totalWorkSeconds: number;
  totalBreakSeconds: number;
  isWorkActive: boolean;
  isBreakActive: boolean;
  sessions: { clockIn: string; clockOut: string }[];
}

interface SessionDisplay {
  index: number;
  clockIn: string;
  clockOut: string;
}

@Component({
  selector: 'app-clock',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './clock.component.html',
  styleUrl: './clock.component.css',
})
export class ClockComponent implements OnInit, OnDestroy {
  readonly PlayIcon = Play;
  readonly PauseIcon = Pause;
  readonly RotateCcwIcon = RotateCcw;
  readonly CoffeeIcon = Coffee;
  readonly ArrowLeftIcon = ArrowLeft;
  readonly ClockIcon = Clock;

  // State signals
  currentTime = signal('00:00');
  workTime = signal(0);
  breakTime = signal(0);
  isWorkActive = signal(false);
  isBreakActive = signal(false);

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

  constructor(private authService: AuthService, private router: Router) {
    this.loadSessionData();
  }

  ngOnInit() {
    this.updateTimers();
    this.timeInterval = setInterval(() => this.updateTimers(), 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
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
    // Update current time
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.currentTime.set(`${hours}:${minutes}`);

    const timestamp = Date.now();

    // Update work timer
    if (this.isWorkActive() && this.sessionData.workStartTime) {
      const elapsed = Math.floor(
        (timestamp - this.sessionData.workStartTime) / 1000
      );
      this.workTime.set(this.sessionData.totalWorkSeconds + elapsed);
    }

    // Update break timer
    if (this.isBreakActive() && this.sessionData.breakStartTime) {
      const elapsed = Math.floor(
        (timestamp - this.sessionData.breakStartTime) / 1000
      );
      this.breakTime.set(this.sessionData.totalBreakSeconds + elapsed);
    }

    this.saveSessionData();
  }

  toggleWork() {
    const now = Date.now();

    if (this.isWorkActive()) {
      // Stop work
      if (this.sessionData.workStartTime) {
        const elapsed = Math.floor(
          (now - this.sessionData.workStartTime) / 1000
        );
        this.sessionData.totalWorkSeconds += elapsed;
        this.workTime.set(this.sessionData.totalWorkSeconds);

        // Save session
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
      this.sessionData.breakStartTime = null;
    } else {
      // Start work
      const clockIn = this.getCurrentTime();
      this.sessionData.sessions.push({ clockIn, clockOut: '' });
      this.sessionData.workStartTime = now;
      this.isWorkActive.set(true);
      this.isBreakActive.set(false);
      this.sessionData.breakStartTime = null;
    }

    this.saveSessionData();
  }

  toggleBreak() {
    if (!this.isWorkActive()) return;

    const now = Date.now();

    if (this.isBreakActive()) {
      // Stop break, resume work
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
    } else {
      // Start break
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
    }

    this.saveSessionData();
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

  getSessionHistory(): SessionDisplay[] {
    return this.sessionData.sessions
      .filter((s) => s.clockOut)
      .map((s, i) => ({
        index: i + 1,
        clockIn: s.clockIn,
        clockOut: s.clockOut,
      }));
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
    this.router.navigate(['/dashboard']);
  }
}
