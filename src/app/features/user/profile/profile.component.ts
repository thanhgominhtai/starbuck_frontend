import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, ConfirmDialogComponent],
  template: `
    <div class="profile-page">
      <div class="profile-container">
        <h1 class="page-title">Hồ Sơ & Thiết Lập Tài Khoản</h1>
        <p class="page-subtitle">Quản lý toàn bộ thông tin cá nhân, bảo mật danh tính và quản trị tài khoản</p>

        <div class="profile-grid">
          <!-- Left Column: Avatar & Summary -->
          <div class="avatar-card">
            <div class="avatar-wrapper">
              <img
                [src]="avatarPreview() || authService.currentUser()?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=profile'"
                alt="Avatar"
                class="avatar-img"
              />
              <label class="avatar-upload-btn" title="Tải ảnh đại diện mới">
                <mat-icon>photo_camera</mat-icon>
                <input type="file" (change)="onAvatarFileChange($event)" accept="image/*" />
              </label>
            </div>

            <h3 class="user-display-name">{{ authService.currentUser()?.name }}</h3>
            <p class="user-display-email">{{ authService.currentUser()?.email }}</p>
            <span class="role-pill" [class.admin-pill]="authService.isAdmin()">
              {{ authService.isAdmin() ? 'Quản trị viên (Admin)' : 'Khách hàng thân thiết (User)' }}
            </span>
          </div>

          <!-- Right Column: Edit Profile & Password Form -->
          <div class="forms-card">
            <!-- 1. Profile Info Section -->
            <div class="section-block">
              <div class="section-header">
                <h3 class="section-title">
                  <mat-icon>badge</mat-icon>
                  Thông tin cá nhân & Email
                </h3>
                <button
                  type="button"
                  class="btn-toggle-edit"
                  *ngIf="!isEditingProfile()"
                  (click)="startEditingProfile()"
                >
                  <mat-icon>edit</mat-icon>
                  Thay đổi thông tin
                </button>
              </div>

              <!-- VIEW MODE -->
              <div class="info-view-mode" *ngIf="!isEditingProfile()">
                <div class="view-item">
                  <span class="item-label">Họ và tên:</span>
                  <span class="item-value">{{ authService.currentUser()?.name }}</span>
                </div>
                <div class="view-item">
                  <span class="item-label">Email đăng nhập:</span>
                  <span class="item-value">{{ authService.currentUser()?.email }}</span>
                </div>
              </div>

              <!-- EDIT MODE (Khi bấm nút Thay đổi thông tin) -->
              <form
                *ngIf="isEditingProfile()"
                [formGroup]="profileForm"
                (ngSubmit)="onUpdateProfile()"
                class="form-layout"
                novalidate
              >
                <div class="form-group" [class.has-error]="isFieldInvalid(profileForm, 'name')">
                  <label>Họ và tên <span class="req-star">*</span></label>
                  <input type="text" formControlName="name" class="input-field" placeholder="Nhập họ và tên" />
                  <div class="error-text" *ngIf="isFieldInvalid(profileForm, 'name')">
                    <span *ngIf="profileForm.get('name')?.errors?.['required']">Họ và tên không được để trống</span>
                    <span *ngIf="profileForm.get('name')?.errors?.['minlength']">Họ và tên phải có ít nhất 2 ký tự</span>
                  </div>
                </div>

                <div class="form-group" [class.has-error]="isFieldInvalid(profileForm, 'email')">
                  <label>Email đăng nhập <span class="req-star">*</span></label>
                  <input type="email" formControlName="email" class="input-field" placeholder="name@example.com" />
                  <div class="error-text" *ngIf="isFieldInvalid(profileForm, 'email')">
                    <span *ngIf="profileForm.get('email')?.errors?.['required']">Email không được để trống</span>
                    <span *ngIf="profileForm.get('email')?.errors?.['pattern']">Email không đúng định dạng (ví dụ: name&#64;gmail.com)</span>
                  </div>
                </div>

                <!-- Security Verification for Email Change -->
                <div class="email-security-box" *ngIf="isEmailChanged()">
                  <div class="security-head">
                    <mat-icon class="shield-icon">security</mat-icon>
                    <div>
                      <strong>Xác minh bảo mật thay đổi Email</strong>
                      <p class="sec-desc">
                        Bạn đang thay đổi Email đăng nhập của tài khoản. Để đảm bảo an toàn, vui lòng nhập Mật khẩu hiện tại để xác minh chính chủ.
                      </p>
                    </div>
                  </div>

                  <div class="form-group" [class.has-error]="profileForm.get('currentPasswordForEmail')?.touched && !profileForm.get('currentPasswordForEmail')?.value">
                    <label>Mật khẩu hiện tại <span class="req-star">*</span></label>
                    <div class="input-pwd-wrap">
                      <input
                        [type]="showVerifyPassword() ? 'text' : 'password'"
                        formControlName="currentPasswordForEmail"
                        class="input-field pwd-input"
                        placeholder="Nhập mật khẩu hiện tại để xác nhận đổi Email"
                      />
                      <button type="button" class="eye-btn" (click)="showVerifyPassword.set(!showVerifyPassword())">
                        <mat-icon>{{ showVerifyPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                      </button>
                    </div>
                    <div class="error-text" *ngIf="profileForm.get('currentPasswordForEmail')?.touched && !profileForm.get('currentPasswordForEmail')?.value">
                      Vui lòng nhập mật khẩu hiện tại để xác thực đổi Email
                    </div>
                  </div>
                </div>

                <div class="btn-action-group">
                  <button type="button" class="btn-cancel" (click)="cancelEditingProfile()">
                    Hủy bỏ
                  </button>
                  <button type="submit" class="btn-save" [disabled]="savingProfile()">
                    {{ savingProfile() ? 'Đang lưu...' : 'Lưu thay đổi' }}
                  </button>
                </div>
              </form>
            </div>

            <hr class="divider" />

            <!-- 2. Change Password Form -->
            <div class="section-block">
              <div class="section-header">
                <h3 class="section-title">
                  <mat-icon>lock</mat-icon>
                  Đổi mật khẩu
                </h3>
                <button
                  type="button"
                  class="btn-toggle-edit"
                  *ngIf="!isChangingPassword()"
                  (click)="startChangingPassword()"
                >
                  <mat-icon>key</mat-icon>
                  Thay đổi mật khẩu
                </button>
              </div>

              <!-- VIEW MODE (Khi chưa bấm Đổi mật khẩu) -->
              <div class="info-view-mode" *ngIf="!isChangingPassword()">
                <p class="pwd-status-text">
                  Mật khẩu tài khoản đang được bảo mật bằng mã hóa Bcrypt tiêu chuẩn.
                </p>
              </div>

              <!-- FORM ĐỔI MẬT KHẨU -->
              <form
                *ngIf="isChangingPassword()"
                [formGroup]="passwordForm"
                (ngSubmit)="onChangePassword()"
                class="form-layout"
                novalidate
              >
                <div class="form-group" [class.has-error]="isFieldInvalid(passwordForm, 'currentPassword')">
                  <label>Mật khẩu hiện tại <span class="req-star">*</span></label>
                  <div class="input-pwd-wrap">
                    <input
                      [type]="showCurrentPassword() ? 'text' : 'password'"
                      formControlName="currentPassword"
                      class="input-field pwd-input"
                      placeholder="Nhập mật khẩu đang sử dụng"
                    />
                    <button type="button" class="eye-btn" (click)="showCurrentPassword.set(!showCurrentPassword())">
                      <mat-icon>{{ showCurrentPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </div>
                  <div class="error-text" *ngIf="isFieldInvalid(passwordForm, 'currentPassword')">
                    Vui lòng nhập mật khẩu hiện tại
                  </div>
                </div>

                <div class="form-group" [class.has-error]="isFieldInvalid(passwordForm, 'newPassword')">
                  <label>Mật khẩu mới (tối thiểu 6 ký tự) <span class="req-star">*</span></label>
                  <div class="input-pwd-wrap">
                    <input
                      [type]="showNewPassword() ? 'text' : 'password'"
                      formControlName="newPassword"
                      class="input-field pwd-input"
                      placeholder="Nhập mật khẩu mới"
                    />
                    <button type="button" class="eye-btn" (click)="showNewPassword.set(!showNewPassword())">
                      <mat-icon>{{ showNewPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                  </div>
                  <div class="error-text" *ngIf="isFieldInvalid(passwordForm, 'newPassword')">
                    <span *ngIf="passwordForm.get('newPassword')?.errors?.['required']">Vui lòng nhập mật khẩu mới</span>
                    <span *ngIf="passwordForm.get('newPassword')?.errors?.['minlength']">Mật khẩu mới phải có ít nhất 6 ký tự</span>
                  </div>
                </div>

                <div class="btn-action-group">
                  <button type="button" class="btn-cancel" (click)="cancelChangingPassword()">
                    Hủy bỏ
                  </button>
                  <button type="submit" class="btn-save btn-pwd" [disabled]="savingPassword()">
                    {{ savingPassword() ? 'Đang đổi mật khẩu...' : 'Cập nhật mật khẩu' }}
                  </button>
                </div>
              </form>
            </div>

            <hr class="divider" />

            <!-- 3. Danger Zone: Delete Account [US-13, US-14] -->
            <div class="danger-zone" *ngIf="!isRootAdmin()">
              <div>
                <h4 class="danger-title">Xoá / Tạm ngưng tài khoản</h4>
                <p class="danger-desc">
                  Tài khoản sẽ chuyển sang trạng thái tạm ngưng (Xóa mềm) và được lưu giữ trong <b>90 ngày</b>. Trong thời gian này, bạn có thể đăng nhập hoặc đăng ký lại để khôi phục toàn bộ dữ liệu bất kỳ lúc nào.
                </p>
              </div>
              <button type="button" class="btn-delete-acc" (click)="openDeleteDialog()">
                <mat-icon>delete_forever</mat-icon>
                Xoá tài khoản
              </button>
            </div>

            <!-- Root Admin Protection Notice -->
            <div class="root-admin-notice" *ngIf="isRootAdmin()">
              <div class="notice-icon-box">
                <mat-icon>verified_user</mat-icon>
              </div>
              <div>
                <h4 class="notice-title">Tài khoản Quản trị viên Gốc (Hệ thống)</h4>
                <p class="notice-desc">
                  Tài khoản này là Quản trị viên gốc của hệ thống Starbucks Recipe, được bảo vệ an toàn vĩnh viễn và không thể xoá bỏ.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- DELETE ACCOUNT CONFIRM DIALOG [FE-13] -->
      <app-confirm-dialog
        [isOpen]="deleteDialogOpen()"
        title="Xác nhận tạm ngưng / xoá tài khoản?"
        message="Tài khoản của bạn sẽ chuyển sang trạng thái tạm ngưng và có 90 ngày ân hạn để khôi phục dữ liệu trước khi bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?"
        confirmText="Xác nhận xoá"
        cancelText="Giữ lại tài khoản"
        type="danger"
        (confirmed)="confirmDeleteAccount()"
        (cancelled)="deleteDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: calc(100vh - 72px);
      background: #f2f0eb;
      padding: 36px 24px 60px;
    }
    .profile-container {
      max-width: 1000px;
      margin: 0 auto;
    }
    .page-title {
      font-size: 26px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }
    .page-subtitle {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.58);
      margin-bottom: 28px;
    }
    .profile-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 28px;
    }
    @media (max-width: 768px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
    .avatar-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 32px 24px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
      height: fit-content;
    }
    .avatar-wrapper {
      position: relative;
      width: 110px;
      height: 110px;
      margin: 0 auto 16px;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #00754a;
    }
    .avatar-upload-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #00754a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .avatar-upload-btn input {
      display: none;
    }
    .avatar-upload-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .user-display-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e3932;
      margin-bottom: 4px;
    }
    .user-display-email {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.58);
      margin-bottom: 14px;
    }
    .role-pill {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 50px;
      font-size: 12px;
      font-weight: 700;
      background: #d4e9e2;
      color: #006241;
    }
    .admin-pill {
      background: #faf6ee;
      color: #b4852e;
      border: 1px solid #cba258;
    }
    .forms-card {
      background: #ffffff;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
    }
    .section-block {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 17px;
      font-weight: 700;
      color: #1e3932;
      margin: 0;
    }
    .section-title mat-icon {
      color: #00754a;
    }
    .btn-toggle-edit {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 50px;
      background: #faf6ee;
      border: 1px solid #cba258;
      color: #b4852e;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-toggle-edit mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .btn-toggle-edit:hover {
      background: #cba258;
      color: #ffffff;
    }
    .info-view-mode {
      background: #f2f0eb;
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .view-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13.5px;
    }
    .item-label {
      color: rgba(0, 0, 0, 0.55);
      font-weight: 600;
    }
    .item-value {
      color: #1e3932;
      font-weight: 700;
    }
    .pwd-status-text {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.65);
      margin: 0;
    }
    .form-layout {
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: fadeIn 0.2s ease-in-out;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 13px;
      font-weight: 700;
      color: #1e3932;
    }
    .req-star {
      color: #c82014;
    }
    .input-field {
      padding: 10px 14px;
      border: 1.5px solid #d6dbde;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      color: #1e3932;
      outline: none;
      transition: all 0.2s;
    }
    .input-field:focus {
      border-color: #00754a;
      box-shadow: 0 0 0 3px rgba(0, 117, 74, 0.15);
    }
    .form-group.has-error .input-field {
      border-color: #c82014;
      background: #fffafa;
    }
    .input-pwd-wrap {
      display: flex;
      align-items: center;
      position: relative;
    }
    .pwd-input {
      width: 100%;
      padding-right: 42px;
    }
    .eye-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(0, 0, 0, 0.45);
      display: flex;
      align-items: center;
    }
    .eye-btn:hover {
      color: #1e3932;
    }
    .error-text {
      font-size: 11.5px;
      color: #c82014;
      font-weight: 600;
      line-height: 1.3;
    }
    .email-security-box {
      background: #faf6ee;
      border: 1.5px dashed #cba258;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      animation: fadeIn 0.2s ease-in-out;
    }
    .security-head {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .shield-icon {
      color: #b4852e;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    .security-head strong {
      font-size: 14px;
      color: #1e3932;
      display: block;
      margin-bottom: 2px;
    }
    .sec-desc {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.65);
      line-height: 1.4;
      margin: 0;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .btn-action-group {
      display: flex;
      gap: 12px;
      margin-top: 4px;
    }
    .btn-save {
      padding: 11px 26px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 117, 74, 0.3);
    }
    .btn-save:hover:not(:disabled) {
      background: #005c3b;
    }
    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-cancel {
      padding: 11px 20px;
      border-radius: 50px;
      background: #edebe9;
      color: rgba(0, 0, 0, 0.87);
      font-size: 14px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-cancel:hover {
      background: #e0dedc;
    }
    .btn-pwd {
      background: #1e3932;
      box-shadow: 0 2px 8px rgba(30, 57, 50, 0.3);
    }
    .btn-pwd:hover:not(:disabled) {
      background: #13241f;
    }
    .divider {
      border: none;
      border-top: 1px solid #edebe9;
      margin: 28px 0;
    }
    .danger-zone {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;
      background: #fde8e7;
      border: 1px solid #c82014;
      border-radius: 14px;
      padding: 20px;
    }
    @media (max-width: 600px) {
      .danger-zone {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    .danger-title {
      font-size: 15px;
      font-weight: 700;
      color: #c82014;
      margin-bottom: 4px;
    }
    .danger-desc {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.7);
      line-height: 1.4;
    }
    .btn-delete-acc {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 50px;
      background: #c82014;
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      white-space: nowrap;
    }
    .root-admin-notice {
      display: flex;
      align-items: center;
      gap: 16px;
      background: linear-gradient(135deg, #fdf8e6 0%, #faecd0 100%);
      border: 1px solid rgba(203, 162, 88, 0.45);
      border-radius: 14px;
      padding: 18px 20px;
    }
    .notice-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(203, 162, 88, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #8c6819;
    }
    .notice-icon-box mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    .notice-title {
      font-size: 15px;
      font-weight: 800;
      color: #8c6819;
      margin: 0 0 4px;
    }
    .notice-desc {
      font-size: 12.5px;
      color: #594211;
      margin: 0;
      line-height: 1.4;
    }
  `],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  avatarPreview = signal<string | null>(null);
  savingProfile = signal<boolean>(false);
  savingPassword = signal<boolean>(false);
  deleteDialogOpen = signal<boolean>(false);

  isEditingProfile = signal<boolean>(false);
  isChangingPassword = signal<boolean>(false);

  showVerifyPassword = signal<boolean>(false);
  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
    currentPasswordForEmail: [''],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  ngOnInit() {
    this.resetFormValues();
  }

  resetFormValues() {
    const user = this.authService.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        currentPasswordForEmail: '',
      });
      if (user.avatarUrl) {
        this.avatarPreview.set(user.avatarUrl);
      }
    }
  }

  startEditingProfile() {
    this.resetFormValues();
    this.isEditingProfile.set(true);
  }

  cancelEditingProfile() {
    this.resetFormValues();
    this.isEditingProfile.set(false);
  }

  startChangingPassword() {
    this.passwordForm.reset();
    this.isChangingPassword.set(true);
  }

  cancelChangingPassword() {
    this.passwordForm.reset();
    this.isChangingPassword.set(false);
  }

  isEmailChanged(): boolean {
    const currentEmail = this.authService.currentUser()?.email || '';
    const formEmail = this.profileForm.get('email')?.value || '';
    return formEmail.toLowerCase().trim() !== currentEmail.toLowerCase().trim();
  }

  isFieldInvalid(form: any, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control && control.touched && control.invalid);
  }

  onAvatarFileChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadService.uploadImage(file).subscribe({
      next: (res) => {
        this.avatarPreview.set(res.url);
        this.authService.updateProfile({ avatarUrl: res.url }).subscribe({
          next: () => this.toast.success('Đã cập nhật ảnh đại diện thành công'),
        });
      },
    });
  }

  onUpdateProfile() {
    this.markAllTouched(this.profileForm);
    if (this.profileForm.invalid) return;

    const { name, email, currentPasswordForEmail } = this.profileForm.value;

    if (this.isEmailChanged() && !currentPasswordForEmail) {
      this.toast.error('Vui lòng nhập mật khẩu hiện tại để xác minh thay đổi Email!');
      return;
    }

    this.savingProfile.set(true);

    this.authService
      .updateProfile({
        name: name!.trim(),
        email: email!.trim(),
        avatarUrl: this.avatarPreview() || undefined,
        currentPassword: currentPasswordForEmail || undefined,
      })
      .subscribe({
        next: () => {
          this.savingProfile.set(false);
          this.toast.success('Cập nhật thông tin tài khoản thành công!');
          this.isEditingProfile.set(false);
        },
        error: () => {
          this.savingProfile.set(false);
        },
      });
  }

  onChangePassword() {
    this.markAllTouched(this.passwordForm);
    if (this.passwordForm.invalid) return;

    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService
      .changePassword({ currentPassword: currentPassword!, newPassword: newPassword! })
      .subscribe({
        next: (res) => {
          this.savingPassword.set(false);
          this.toast.success(res.message || 'Đổi mật khẩu thành công!');
          this.passwordForm.reset();
          this.isChangingPassword.set(false);
        },
        error: () => {
          this.savingPassword.set(false);
        },
      });
  }

  isRootAdmin(): boolean {
    const email = this.authService.currentUser()?.email || '';
    return email.toLowerCase() === 'admin@starbucks.vn';
  }

  openDeleteDialog() {
    if (this.isRootAdmin()) {
      this.toast.error('Không thể xoá tài khoản Quản trị viên gốc của hệ thống (admin@starbucks.vn)');
      return;
    }
    this.deleteDialogOpen.set(true);
  }

  confirmDeleteAccount() {
    if (this.isRootAdmin()) {
      this.toast.error('Không thể xoá tài khoản Quản trị viên gốc của hệ thống (admin@starbucks.vn)');
      this.deleteDialogOpen.set(false);
      return;
    }
    this.authService.deleteAccount().subscribe();
  }

  private markAllTouched(form: any) {
    Object.values(form.controls).forEach((ctrl: any) => {
      ctrl.markAsTouched();
    });
  }
}
