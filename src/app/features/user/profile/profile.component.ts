import { Component, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, COMPOSITION_BUFFER_MODE } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { ImageModerationService } from '../../../core/services/image-moderation.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, ConfirmDialogComponent],
  providers: [{ provide: COMPOSITION_BUFFER_MODE, useValue: false }],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private uploadService = inject(UploadService);
  private toast = inject(ToastService);
  private imageModeration = inject(ImageModerationService);

  avatarPreview = signal<string | null>(null);
  savingProfile = signal<boolean>(false);
  savingPassword = signal<boolean>(false);
  deleteDialogOpen = signal<boolean>(false);

  isEditingProfile = signal<boolean>(false);
  isChangingPassword = signal<boolean>(false);

  showVerifyPassword = signal<boolean>(false);
  showCurrentPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);

  // Avatar Crop Modal Signals & State
  showCropModal = signal<boolean>(false);
  cropImageSrc = signal<string | null>(null);
  cropZoom = signal<number>(1);
  baseImgWidth = signal<number>(230);
  baseImgHeight = signal<number>(230);
  cropPanX = signal<number>(0);
  cropPanY = signal<number>(0);
  cropRotation = signal<number>(0);
  uploadingAvatar = signal<boolean>(false);

  @ViewChild('previewCanvas') previewCanvasRef?: ElementRef<HTMLCanvasElement>;
  private loadedImg: HTMLImageElement | null = null;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private startPanX = 0;
  private startPanY = 0;

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
    currentPasswordForEmail: [''],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  onInputSync(form: any, controlName: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const control = form.get(controlName);
    if (control && target) {
      if (control.value !== target.value) {
        control.setValue(target.value, { emitEvent: true });
        control.updateValueAndValidity();
      }
    }
  }

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

  focusedField = signal<string | null>(null);

  onFocus(fieldName: string) {
    this.focusedField.set(fieldName);
  }

  onBlur(fieldName: string, form?: any) {
    if (this.focusedField() === fieldName) {
      this.focusedField.set(null);
    }
    if (form) {
      form.get(fieldName)?.markAsTouched();
    }
  }

  isFieldInvalid(form: any, fieldName: string): boolean {
    const control = form.get(fieldName);
    if (!control || !control.invalid) return false;
    if (this.focusedField() === fieldName) return false;
    return !!control.touched;
  }

  onAvatarError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = this.authService.defaultAvatar;
    }
  }

  // --- AVATAR CROP & FRAMING WORKFLOW ---
  async onAvatarFileChange(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('Vui lòng chọn một file hình ảnh hợp lệ (jpg, png, webp,...)');
      return;
    }

    // AI Sensitive / NSFW Image Scan
    const modResult = await this.imageModeration.scanImage(file);
    if (!modResult.isSafe) {
      this.toast.error(
        modResult.reason ||
          '⚠️ Hình ảnh chứa nội dung nhạy cảm hoặc không phù hợp với chuẩn mực cộng đồng Starbucks. Vui lòng chọn ảnh khác!',
      );
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const dataUrl = e.target.result;
      this.cropImageSrc.set(dataUrl);
      this.cropZoom.set(1);
      this.cropPanX.set(0);
      this.cropPanY.set(0);
      this.cropRotation.set(0);
      this.showCropModal.set(true);

      const img = new Image();
      img.onload = () => {
        this.loadedImg = img;
        this.calculateBaseDimensions(img);
        setTimeout(() => this.updateLivePreview(), 50);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset input so user can choose same file again if desired
    event.target.value = '';
  }

  onImageLoaded(event: Event) {
    const target = event.target as HTMLImageElement;
    this.loadedImg = target;
    this.calculateBaseDimensions(target);
    this.updateLivePreview();
  }

  private calculateBaseDimensions(img: HTMLImageElement) {
    const imgW = img.naturalWidth || img.width || 300;
    const imgH = img.naturalHeight || img.height || 300;
    // Fit the image comfortably inside the 230px circle viewport
    const baseScale = 230 / Math.max(imgW, imgH);
    this.baseImgWidth.set(Math.round(imgW * baseScale));
    this.baseImgHeight.set(Math.round(imgH * baseScale));
  }

  getImageTransform(): string {
    return `translate(${this.cropPanX()}px, ${this.cropPanY()}px) scale(${this.cropZoom()}) rotate(${this.cropRotation()}deg)`;
  }

  startDrag(e: MouseEvent) {
    e.preventDefault();
    this.isDragging = true;
    this.dragStartX = e.clientX;
    this.dragStartY = e.clientY;
    this.startPanX = this.cropPanX();
    this.startPanY = this.cropPanY();
  }

  onDrag(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - this.dragStartX;
    const deltaY = e.clientY - this.dragStartY;
    this.cropPanX.set(this.startPanX + deltaX);
    this.cropPanY.set(this.startPanY + deltaY);
    this.updateLivePreview();
  }

  endDrag() {
    this.isDragging = false;
  }

  startTouchDrag(e: TouchEvent) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.dragStartX = e.touches[0].clientX;
      this.dragStartY = e.touches[0].clientY;
      this.startPanX = this.cropPanX();
      this.startPanY = this.cropPanY();
    }
  }

  onTouchDrag(e: TouchEvent) {
    if (!this.isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - this.dragStartX;
    const deltaY = e.touches[0].clientY - this.dragStartY;
    this.cropPanX.set(this.startPanX + deltaX);
    this.cropPanY.set(this.startPanY + deltaY);
    this.updateLivePreview();
  }

  onWheelZoom(e: WheelEvent) {
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
    this.adjustZoom(zoomStep);
  }

  adjustZoom(delta: number) {
    const cur = this.cropZoom();
    const next = Math.min(Math.max(cur + delta, 0.2), 3.0);
    this.cropZoom.set(Number(next.toFixed(2)));
    this.updateLivePreview();
  }

  onZoomSliderChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    this.cropZoom.set(val);
    this.updateLivePreview();
  }

  rotateCrop() {
    this.cropRotation.update((r) => (r + 90) % 360);
    this.updateLivePreview();
  }

  resetCrop() {
    this.cropZoom.set(1);
    this.cropPanX.set(0);
    this.cropPanY.set(0);
    this.cropRotation.set(0);
    this.updateLivePreview();
  }

  cancelCrop() {
    this.showCropModal.set(false);
    this.cropImageSrc.set(null);
    this.loadedImg = null;
  }

  updateLivePreview() {
    if (!this.loadedImg || !this.previewCanvasRef) return;
    const canvas = this.previewCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 100;
    canvas.width = size;
    canvas.height = size;
    ctx.clearRect(0, 0, size, size);

    // Make circle clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const maskDiameter = 230;
    const ratio = size / maskDiameter;
    const bw = this.baseImgWidth();
    const bh = this.baseImgHeight();

    ctx.translate(size / 2, size / 2);
    ctx.rotate((this.cropRotation() * Math.PI) / 180);

    const drawW = bw * this.cropZoom() * ratio;
    const drawH = bh * this.cropZoom() * ratio;
    const drawX = -drawW / 2 + this.cropPanX() * ratio;
    const drawY = -drawH / 2 + this.cropPanY() * ratio;

    ctx.drawImage(this.loadedImg, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  async confirmCropAndUpload() {
    if (!this.loadedImg) return;
    this.uploadingAvatar.set(true);

    const outputSize = 400; // High resolution square canvas
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      this.uploadingAvatar.set(false);
      this.toast.error('Không thể xử lý khung ảnh đại diện');
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const maskDiameter = 230;
    const ratio = outputSize / maskDiameter;
    const bw = this.baseImgWidth();
    const bh = this.baseImgHeight();

    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.rotate((this.cropRotation() * Math.PI) / 180);

    const drawW = bw * this.cropZoom() * ratio;
    const drawH = bh * this.cropZoom() * ratio;
    const drawX = -drawW / 2 + this.cropPanX() * ratio;
    const drawY = -drawH / 2 + this.cropPanY() * ratio;

    ctx.drawImage(this.loadedImg, drawX, drawY, drawW, drawH);

    // AI Sensitive / NSFW Scan on the final cropped canvas
    const modResult = await this.imageModeration.scanImage(canvas);
    if (!modResult.isSafe) {
      this.uploadingAvatar.set(false);
      this.toast.error(
        modResult.reason ||
          '⚠️ Hình ảnh chứa nội dung nhạy cảm hoặc không phù hợp với chuẩn mực cộng đồng Starbucks. Vui lòng chọn ảnh khác!',
      );
      return;
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          this.uploadingAvatar.set(false);
          this.toast.error('Lỗi khi xuất ảnh');
          return;
        }

        const croppedFile = new File([blob], `avatar-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });

        this.uploadService.uploadImage(croppedFile).subscribe({
          next: (res) => {
            this.authService.updateProfile({ avatarUrl: res.url }).subscribe({
              next: () => {
                this.avatarPreview.set(res.url);
                this.uploadingAvatar.set(false);
                this.showCropModal.set(false);
                this.cropImageSrc.set(null);
                this.loadedImg = null;
                this.toast.success('Đã cập nhật ảnh đại diện mới thành công! ✨');
              },
              error: () => {
                this.uploadingAvatar.set(false);
                this.toast.error('Không thể cập nhật hồ sơ với ảnh mới');
              },
            });
          },
          error: (err) => {
            this.uploadingAvatar.set(false);
            if (err?.status !== 400) {
              this.toast.error('Không thể tải ảnh lên máy chủ, vui lòng thử lại');
            }
          },
        });
      },
      'image/jpeg',
      0.92,
    );
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
