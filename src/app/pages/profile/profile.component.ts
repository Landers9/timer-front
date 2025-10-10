// src/app/pages/profile/profile.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Edit,
  Save,
  X,
  Lock,
  Clock,
  TrendingUp,
} from 'lucide-angular';
import { AuthService } from '../../services/auth.service';

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'employee' | 'manager';
  joinDate: Date;
  department?: string;
  position?: string;
}

interface ProfileStats {
  totalHours: number;
  avgHoursPerDay: number;
  attendanceRate: number;
  daysWorked: number;
  lateCount: number;
}

interface RecentActivity {
  id: number;
  date: Date;
  clockIn: string;
  clockOut: string | null;
  totalHours: number | null;
  status: 'completed' | 'in-progress';
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  // Icons
  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly BriefcaseIcon = Briefcase;
  readonly CalendarIcon = Calendar;
  readonly EditIcon = Edit;
  readonly SaveIcon = Save;
  readonly XIcon = X;
  readonly LockIcon = Lock;
  readonly ClockIcon = Clock;
  readonly TrendingUpIcon = TrendingUp;

  // Edit mode
  isEditMode = signal(false);
  showPasswordModal = signal(false);

  // User data
  userProfile = signal<UserProfile>({
    id: 1,
    firstName: 'John',
    lastName: 'Manager',
    email: 'manager@example.com',
    phoneNumber: '+33612345678',
    role: 'manager',
    joinDate: new Date('2023-01-15'),
    department: 'Direction',
    position: 'Manager Général',
  });

  // Form data for editing
  formData = signal<Partial<UserProfile>>({});

  // Password form
  passwordForm = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Stats
  stats = signal<ProfileStats>({
    totalHours: 342,
    avgHoursPerDay: 8.2,
    attendanceRate: 96,
    daysWorked: 42,
    lateCount: 3,
  });

  // Recent activity
  recentActivities = signal<RecentActivity[]>([
    {
      id: 1,
      date: new Date('2025-10-10'),
      clockIn: '08:30',
      clockOut: null,
      totalHours: null,
      status: 'in-progress',
    },
    {
      id: 2,
      date: new Date('2025-10-09'),
      clockIn: '08:45',
      clockOut: '17:30',
      totalHours: 8,
      status: 'completed',
    },
    {
      id: 3,
      date: new Date('2025-10-08'),
      clockIn: '08:30',
      clockOut: '17:30',
      totalHours: 8,
      status: 'completed',
    },
    {
      id: 4,
      date: new Date('2025-10-07'),
      clockIn: '09:00',
      clockOut: '17:15',
      totalHours: 7.5,
      status: 'completed',
    },
    {
      id: 5,
      date: new Date('2025-10-06'),
      clockIn: '08:30',
      clockOut: '17:30',
      totalHours: 8,
      status: 'completed',
    },
  ]);

  // Computed
  fullName = computed(() => {
    const profile = this.userProfile();
    return `${profile.firstName} ${profile.lastName}`;
  });

  memberSince = computed(() => {
    const profile = this.userProfile();
    const months = Math.floor(
      (new Date().getTime() - profile.joinDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );
    return months;
  });

  avatarUrl = computed(() => {
    const profile = this.userProfile();
    return `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=FFC300&color=1A1A1A&bold=true&size=200`;
  });

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Load user profile from auth service
    const currentUser = this.authService.currentUser();
    if (currentUser) {
      this.userProfile.update((profile) => ({
        ...profile,
        ...currentUser,
      }));
    }
  }

  // Edit mode
  enterEditMode(): void {
    this.formData.set({ ...this.userProfile() });
    this.isEditMode.set(true);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.formData.set({});
  }

  saveProfile(): void {
    const updatedProfile = {
      ...this.userProfile(),
      ...this.formData(),
    } as UserProfile;

    this.userProfile.set(updatedProfile);
    this.isEditMode.set(false);

    // TODO: Call API to update profile
    console.log('Profile updated:', updatedProfile);
  }

  // Password change
  openPasswordModal(): void {
    this.showPasswordModal.set(true);
    this.passwordForm.set({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
  }

  changePassword(): void {
    const form = this.passwordForm();

    if (form.newPassword !== form.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (form.newPassword.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // TODO: Call API to change password
    console.log('Password change requested');
    alert('Mot de passe changé avec succès !');
    this.closePasswordModal();
  }

  // Helpers
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  formatJoinDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  getStatusBadgeClass(status: string): string {
    return status === 'completed' ? 'badge-success' : 'badge-warning';
  }

  getRoleBadge(role: string): string {
    return role === 'manager' ? 'badge-primary' : 'badge-secondary';
  }

  getRoleLabel(role: string): string {
    return role === 'manager' ? 'Manager' : 'Employé';
  }
}
