import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, ConfirmDialogComponent],
  templateUrl: './admin-manager.component.html',
  styleUrl: './admin-manager.component.css',
})
export class AdminManagerComponent implements OnInit {
  public authService = inject(AuthService);
  private toast = inject(ToastService);

  admins = signal<User[]>([]);
  candidateUsers = signal<User[]>([]);
  searchControl = new FormControl('');
  userSearchControl = new FormControl('');

  addModalOpen = signal<boolean>(false);
  revokeDialogOpen = signal<boolean>(false);
  targetAdmin = signal<User | null>(null);

  ngOnInit() {
    this.fetchAdmins();
  }

  fetchAdmins() {
    const keyword = this.searchControl.value || '';
    this.authService.getAdmins(keyword).subscribe({
      next: (data) => this.admins.set(data),
    });
  }

  openAddModal() {
    this.addModalOpen.set(true);
    this.searchUsers();
  }

  searchUsers() {
    const keyword = this.userSearchControl.value || '';
    this.authService.getAllUsers(keyword).subscribe({
      next: (data) => this.candidateUsers.set(data),
    });
  }

  grantAdmin(user: User) {
    this.authService.updateUserRole(user.id, 'ADMIN').subscribe({
      next: () => {
        this.toast.success(`Đã cấp quyền Admin thành công cho ${user.name}`);
        this.fetchAdmins();
        this.searchUsers();
      },
    });
  }

  isRootAdmin(admin: User): boolean {
    return (admin.email || '').toLowerCase() === 'admin@starbucks.vn';
  }

  isCurrentUser(admin: User): boolean {
    const current = this.authService.currentUser();
    if (!current) return false;
    const sameId = Boolean(admin.id && current.id && admin.id === current.id);
    const sameEmail = Boolean(
      admin.email &&
        current.email &&
        admin.email.toLowerCase() === current.email.toLowerCase(),
    );
    return sameId || sameEmail;
  }

  canRevoke(admin: User): boolean {
    if (this.isRootAdmin(admin)) return false;
    if (this.isCurrentUser(admin)) return false;
    return true;
  }

  openRevokeConfirm(admin: User) {
    if (!this.canRevoke(admin)) {
      if (this.isRootAdmin(admin)) {
        this.toast.error('Không thể thu hồi quyền Quản trị viên gốc (admin@starbucks.vn)');
      } else if (this.isCurrentUser(admin)) {
        this.toast.error('Bạn không thể tự thu hồi quyền Admin của chính mình');
      }
      return;
    }
    this.targetAdmin.set(admin);
    this.revokeDialogOpen.set(true);
  }

  confirmRevokeAdmin() {
    if (!this.targetAdmin()) return;
    const admin = this.targetAdmin()!;

    this.authService.updateUserRole(admin.id, 'USER').subscribe({
      next: () => {
        this.toast.success(`Đã thu hồi quyền Admin của ${admin.name}`);
        this.revokeDialogOpen.set(false);
        this.targetAdmin.set(null);
        this.fetchAdmins();
      },
      error: () => {
        this.revokeDialogOpen.set(false);
      },
    });
  }
}
