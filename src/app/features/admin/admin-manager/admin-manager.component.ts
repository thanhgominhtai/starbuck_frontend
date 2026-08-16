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
  template: `
    <div class="admin-mgr-view">
      <!-- Header -->
      <div class="mgr-head">
        <div>
          <h1 class="mgr-title">Quản Trị Danh Sách Quản Trị Viên</h1>
          <p class="mgr-sub">Quản lý quyền hạn hệ thống, cấp quyền hoặc thu hồi quyền Admin</p>
        </div>

        <button class="btn-add-admin" (click)="openAddModal()">
          <mat-icon>person_add</mat-icon>
          Cấp quyền Admin cho User
        </button>
      </div>

      <!-- Search Box -->
      <div class="search-bar">
        <mat-icon>search</mat-icon>
        <input
          type="text"
          [formControl]="searchControl"
          placeholder="Tìm kiếm quản trị viên theo tên hoặc email..."
          (keyup.enter)="fetchAdmins()"
        />
      </div>

      <!-- Admin List Table -->
      <div class="table-container">
        <table class="sb-table">
          <thead>
            <tr>
              <th>AVATAR</th>
              <th>HỌ VÀ TÊN</th>
              <th>EMAIL</th>
              <th>VAI TRÒ</th>
              <th>NGÀY TẠO</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let admin of admins()">
              <td>
                <img
                  [src]="admin.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + admin.email"
                  class="admin-thumb"
                  alt="Avatar"
                />
              </td>
              <td><strong>{{ admin.name }}</strong></td>
              <td>{{ admin.email }}</td>
              <td>
                <span class="badge-role">ADMIN</span>
              </td>
              <td>{{ admin.createdAt | date: 'dd/MM/yyyy' }}</td>
              <td>
                <button
                  class="btn-revoke"
                  (click)="openRevokeConfirm(admin)"
                  [disabled]="admin.id === authService.currentUser()?.id && admins().length <= 1"
                  title="Thu hồi quyền Admin"
                >
                  <mat-icon>person_remove</mat-icon>
                  Thu hồi Admin
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- GRANT ADMIN ROLE MODAL [AD-06] -->
      <div class="modal-backdrop" *ngIf="addModalOpen()">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Cấp quyền Quản trị viên (Admin)</h3>
            <button class="btn-close" (click)="addModalOpen.set(false)">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <p class="modal-desc">
            Tìm kiếm người dùng thông thường trong hệ thống và nâng cấp tài khoản thành Quản trị viên:
          </p>

          <div class="user-search-input">
            <mat-icon>search</mat-icon>
            <input
              type="text"
              [formControl]="userSearchControl"
              placeholder="Nhập tên hoặc email user..."
              (input)="searchUsers()"
            />
          </div>

          <div class="user-results-list">
            <div *ngFor="let u of candidateUsers()" class="user-item">
              <img [src]="u.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + u.email" class="cand-thumb" />
              <div class="cand-info">
                <span class="cand-name">{{ u.name }}</span>
                <span class="cand-email">{{ u.email }} ({{ u.role }})</span>
              </div>
              <button
                class="btn-grant"
                *ngIf="u.role !== 'ADMIN'"
                (click)="grantAdmin(u)"
              >
                Cấp Admin
              </button>
              <span class="already-admin" *ngIf="u.role === 'ADMIN'">Đã là Admin</span>
            </div>
            <div *ngIf="candidateUsers().length === 0" class="no-cand">
              Nhập từ khóa để tìm kiếm người dùng.
            </div>
          </div>
        </div>
      </div>

      <!-- CONFIRM REVOKE DIALOG [FE-13, AD-07] -->
      <app-confirm-dialog
        [isOpen]="revokeDialogOpen()"
        title="Xác nhận thu hồi quyền Admin"
        [message]="'Bạn có chắc chắn muốn hạ quyền Quản trị viên của ' + (targetAdmin()?.name || '') + ' xuống tài khoản User thông thường không?'"
        confirmText="Xác nhận thu hồi"
        cancelText="Bỏ qua"
        type="warning"
        (confirmed)="confirmRevokeAdmin()"
        (cancelled)="revokeDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .admin-mgr-view {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .mgr-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .mgr-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }
    .mgr-sub {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.58);
    }
    .btn-add-admin {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 117, 74, 0.3);
    }
    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: #ffffff;
      border-radius: 50px;
      border: 1px solid #edebe9;
      max-width: 440px;
    }
    .search-bar input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px;
      font-family: inherit;
    }
    .table-container {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
      overflow-x: auto;
    }
    .sb-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .sb-table th {
      padding: 16px 20px;
      background: #faf6ee;
      color: #1e3932;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #edebe9;
    }
    .sb-table td {
      padding: 14px 20px;
      border-bottom: 1px solid #f2f0eb;
      vertical-align: middle;
    }
    .admin-thumb {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid #cba258;
    }
    .badge-role {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 800;
      background: #faf6ee;
      color: #b4852e;
      border: 1px solid #cba258;
    }
    .btn-revoke {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 50px;
      background: #fde8e7;
      color: #c82014;
      border: 1px solid rgba(200, 32, 20, 0.2);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-revoke:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 16px;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 28px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .modal-header h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1e3932;
    }
    .btn-close {
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.4);
    }
    .modal-desc {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 16px;
    }
    .user-search-input {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border: 1px solid #d6dbde;
      border-radius: 10px;
      margin-bottom: 16px;
    }
    .user-search-input input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px;
    }
    .user-results-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 240px;
      overflow-y: auto;
    }
    .user-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 10px;
      background: #f2f0eb;
    }
    .cand-thumb {
      width: 32px;
      height: 32px;
      border-radius: 50%;
    }
    .cand-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .cand-name {
      font-weight: 700;
      font-size: 13px;
      color: #1e3932;
    }
    .cand-email {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
    }
    .btn-grant {
      padding: 6px 14px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
    .already-admin {
      font-size: 11px;
      font-weight: 700;
      color: #b4852e;
    }
    .no-cand {
      text-align: center;
      font-size: 13px;
      color: rgba(0, 0, 0, 0.4);
      padding: 20px;
    }
  `],
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

  openRevokeConfirm(admin: User) {
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
