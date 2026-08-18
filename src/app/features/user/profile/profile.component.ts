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
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
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
