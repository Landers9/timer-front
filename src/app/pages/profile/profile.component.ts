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
  Eye,
  EyeOff,
} from 'lucide-angular';
import { UserService } from '../../services/user.service';
import { User as UserModel } from '../../models/user.model';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  createdAt: Date;
  department: string;
  position: string;
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
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;

  // Loading states
  isLoadingProfile = signal(true);
  isSavingProfile = signal(false);
  isChangingPassword = signal(false);

  // Edit mode
  isEditMode = signal(false);
  showPasswordModal = signal(false);

  // Show/Hide password
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  // Error messages
  profileError = signal<string | null>(null);
  passwordError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // User data
  userProfile = signal<UserProfile>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'EMPLOYEE',
    createdAt: new Date(),
    department: '',
    position: '',
  });

  // Form data for editing
  formData = signal<Partial<UserProfile>>({});

  // Password form
  passwordForm = signal({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Computed properties
  fullName = computed(() => {
    const profile = this.userProfile();
    return `${profile.firstName} ${profile.lastName}`;
  });

  avatarUrl = computed(() => {
    const profile = this.userProfile();
    return `https://ui-avatars.com/api/?name=${profile.firstName}+${profile.lastName}&background=FFC300&color=1A1A1A&bold=true`;
  });

  memberSince = computed(() => {
    const profile = this.userProfile();
    const now = new Date();
    const joined = profile.createdAt;
    const months =
      (now.getFullYear() - joined.getFullYear()) * 12 +
      (now.getMonth() - joined.getMonth());
    return months;
  });

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  /**
   * Charger le profil utilisateur depuis l'API
   */
  private loadUserProfile(): void {
    this.isLoadingProfile.set(true);
    this.profileError.set(null);

    this.userService.getCurrentUser().subscribe({
      next: (response: UserModel) => {
        this.mapApiResponseToProfile(response);
        this.isLoadingProfile.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.profileError.set(error.message);
        this.isLoadingProfile.set(false);
      },
    });
  }

  /**
   * Mapper la réponse API vers notre interface UserProfile
   */
  private mapApiResponseToProfile(response: UserModel): void {
    this.userProfile.set({
      id: response.id,
      firstName: response.first_name,
      lastName: response.last_name,
      email: response.email,
      phoneNumber: response.phone_number || '',
      role: response.role,
      createdAt: new Date(response.created_at),
      department: response.department || '',
      position: response.position || '',
    });
  }

  // Edit mode
  enterEditMode(): void {
    this.formData.set({ ...this.userProfile() });
    this.isEditMode.set(true);
    this.profileError.set(null);
    this.successMessage.set(null);
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.formData.set({});
    this.profileError.set(null);
  }

  saveProfile(): void {
    const profile = this.userProfile();
    const form = this.formData();

    // Validation
    if (!form.firstName || !form.lastName || !form.email) {
      this.profileError.set('Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.isSavingProfile.set(true);
    this.profileError.set(null);
    this.successMessage.set(null);

    // Préparer les données pour l'API
    const updateData = {
      email: form.email!,
      first_name: form.firstName!,
      last_name: form.lastName!,
      phone_number: form.phoneNumber || undefined,
      position: form.position || undefined,
      department: form.department || undefined,
    };

    this.userService.updateUser(profile.id, updateData).subscribe({
      next: (response: UserModel) => {
        this.mapApiResponseToProfile(response);
        this.isEditMode.set(false);
        this.isSavingProfile.set(false);
        this.successMessage.set('Profil mis à jour avec succès !');

        // Effacer le message de succès après 3 secondes
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du profil:', error);
        this.profileError.set(error.message);
        this.isSavingProfile.set(false);
      },
    });
  }

  // Password change
  openPasswordModal(): void {
    this.showPasswordModal.set(true);
    this.passwordError.set(null);
    this.passwordForm.set({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    // Réinitialiser les visibilités
    this.showCurrentPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.passwordError.set(null);
  }

  changePassword(): void {
    const form = this.passwordForm();
    const profile = this.userProfile();

    // Validation
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      this.passwordError.set('Veuillez remplir tous les champs');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      this.passwordError.set('Les mots de passe ne correspondent pas');
      return;
    }

    if (form.newPassword.length < 8) {
      this.passwordError.set(
        'Le mot de passe doit contenir au moins 8 caractères'
      );
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordError.set(null);

    const changePasswordData = {
      old_password: form.currentPassword,
      new_password: form.newPassword,
    };

    this.userService.changePassword(profile.id, changePasswordData).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.closePasswordModal();
        this.successMessage.set('Mot de passe changé avec succès !');

        // Effacer le message de succès après 3 secondes
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (error) => {
        console.error('Erreur lors du changement de mot de passe:', error);
        this.passwordError.set(error.message);
        this.isChangingPassword.set(false);
      },
    });
  }

  // Helpers
  formatJoinDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  }

  getRoleBadge(role: string): string {
    return role === 'MANAGER' || role === 'ADMIN'
      ? 'badge-primary'
      : 'badge-secondary';
  }

  getRoleLabel(role: string): string {
    if (role === 'MANAGER') return 'Manager';
    if (role === 'ADMIN') return 'Administrateur';
    return 'Employé';
  }
}
