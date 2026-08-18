import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

type AuthMode = 'signin' | 'signup' | 'forgot_step1' | 'forgot_step2' | 'forgot_step3';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <!-- Logo & Header -->
        <div class="auth-header">
          <div class="brand-badge">
            <mat-icon>local_cafe</mat-icon>
          </div>
          <h2 class="auth-title">{{ getHeaderTitle() }}</h2>
          <p class="auth-subtitle">{{ getHeaderSubtitle() }}</p>
        </div>

        <!-- Global Error Alert Box -->
        <div class="server-error-banner" *ngIf="errorMessage()">
          <mat-icon>error_outline</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Tab Mode Switcher (Sign In vs Sign Up) -->
        <div class="tab-switcher" *ngIf="mode() === 'signin' || mode() === 'signup'">
          <button
            type="button"
            class="tab-btn"
            [class.active]="mode() === 'signin'"
            (click)="setMode('signin')"
          >
            Đăng nhập
          </button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="mode() === 'signup'"
            (click)="setMode('signup')"
          >
            Đăng ký
          </button>
        </div>

        <!-- 1. SIGN IN FORM -->
        <form
          *ngIf="mode() === 'signin'"
          [formGroup]="signInForm"
          (ngSubmit)="onSignIn()"
          class="auth-form"
          novalidate
        >
          <div class="form-group" [class.has-error]="isFieldInvalid(signInForm, 'email')">
            <label>Địa chỉ Email <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>email</mat-icon>
              <input
                type="email"
                formControlName="email"
                placeholder="name@example.com"
                autocomplete="email"
              />
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(signInForm, 'email')">
              <span *ngIf="signInForm.get('email')?.errors?.['required']"
                >Vui lòng nhập địa chỉ email</span
              >
              <span *ngIf="signInForm.get('email')?.errors?.['pattern']"
                >Email không đúng định dạng (ví dụ: name&#64;gmail.com)</span
              >
            </div>
          </div>

          <div class="form-group" [class.has-error]="isFieldInvalid(signInForm, 'password')">
            <div class="label-row">
              <label>Mật khẩu <span class="req-star">*</span></label>
              <button type="button" class="link-btn" (click)="setMode('forgot_step1')">
                Quên mật khẩu?
              </button>
            </div>
            <div class="input-wrap">
              <mat-icon>lock</mat-icon>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Nhập mật khẩu của bạn"
                autocomplete="current-password"
              />
              <button
                type="button"
                class="eye-btn"
                (click)="toggleShowPassword()"
                title="Ẩn/Hiện mật khẩu"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(signInForm, 'password')">
              <span *ngIf="signInForm.get('password')?.errors?.['required']"
                >Vui lòng nhập mật khẩu</span
              >
              <span *ngIf="signInForm.get('password')?.errors?.['minlength']"
                >Mật khẩu phải có ít nhất 6 ký tự</span
              >
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading()">
            <span *ngIf="!loading()">Đăng nhập</span>
            <span *ngIf="loading()">Đang xác thực...</span>
          </button>
        </form>

        <!-- 2. SIGN UP FORM -->
        <form
          *ngIf="mode() === 'signup'"
          [formGroup]="signUpForm"
          (ngSubmit)="onSignUp()"
          class="auth-form"
          novalidate
        >
          <div class="form-group" [class.has-error]="isFieldInvalid(signUpForm, 'name')">
            <label>Họ và tên <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>person</mat-icon>
              <input
                type="text"
                formControlName="name"
                placeholder="Ví dụ: Nguyễn Văn A"
                autocomplete="name"
              />
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(signUpForm, 'name')">
              <span *ngIf="signUpForm.get('name')?.errors?.['required']"
                >Vui lòng nhập họ và tên</span
              >
              <span *ngIf="signUpForm.get('name')?.errors?.['minlength']"
                >Họ và tên phải có ít nhất 2 ký tự</span
              >
            </div>
          </div>

          <div class="form-group" [class.has-error]="isFieldInvalid(signUpForm, 'email')">
            <label>Địa chỉ Email <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>email</mat-icon>
              <input
                type="email"
                formControlName="email"
                placeholder="name@example.com"
                autocomplete="email"
              />
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(signUpForm, 'email')">
              <span *ngIf="signUpForm.get('email')?.errors?.['required']"
                >Vui lòng nhập địa chỉ email</span
              >
              <span *ngIf="signUpForm.get('email')?.errors?.['pattern']"
                >Email không đúng định dạng (ví dụ: name&#64;gmail.com)</span
              >
            </div>
          </div>

          <div class="form-group" [class.has-error]="isFieldInvalid(signUpForm, 'password')">
            <label>Mật khẩu <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>lock</mat-icon>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="eye-btn"
                (click)="toggleShowPassword()"
                title="Ẩn/Hiện mật khẩu"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(signUpForm, 'password')">
              <span *ngIf="signUpForm.get('password')?.errors?.['required']"
                >Vui lòng nhập mật khẩu</span
              >
              <span *ngIf="signUpForm.get('password')?.errors?.['minlength']"
                >Mật khẩu phải có ít nhất 6 ký tự</span
              >
            </div>
          </div>

          <div
            class="form-group"
            [class.has-error]="
              isFieldInvalid(signUpForm, 'confirmPassword') ||
              (signUpForm.get('confirmPassword')?.touched &&
                signUpForm.errors?.['passwordMismatch'])
            "
          >
            <label>Xác nhận lại mật khẩu <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>lock_clock</mat-icon>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="Nhập lại mật khẩu vừa tạo"
                autocomplete="new-password"
              />
            </div>
            <div class="error-text" *ngIf="signUpForm.get('confirmPassword')?.touched">
              <span *ngIf="signUpForm.get('confirmPassword')?.errors?.['required']"
                >Vui lòng nhập lại mật khẩu xác nhận</span
              >
              <span
                *ngIf="
                  !signUpForm.get('confirmPassword')?.errors?.['required'] &&
                  signUpForm.errors?.['passwordMismatch']
                "
              >
                Mật khẩu xác nhận không trùng khớp
              </span>
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading()">
            <span *ngIf="!loading()">Đăng ký tài khoản</span>
            <span *ngIf="loading()">Đang tạo tài khoản...</span>
          </button>
        </form>

        <!-- 3. FORGOT PASSWORD - STEP 1 (Input Email) -->
        <form
          *ngIf="mode() === 'forgot_step1'"
          [formGroup]="forgotStep1Form"
          (ngSubmit)="onForgotStep1()"
          class="auth-form"
          novalidate
        >
          <p class="guide-text">
            Nhập email tài khoản của bạn để hệ thống gửi mã OTP 6 số xác thực khôi phục mật khẩu.
          </p>

          <div class="form-group" [class.has-error]="isFieldInvalid(forgotStep1Form, 'email')">
            <label>Email tài khoản <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>email</mat-icon>
              <input
                type="email"
                formControlName="email"
                placeholder="name@example.com"
                autocomplete="email"
              />
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(forgotStep1Form, 'email')">
              <span *ngIf="forgotStep1Form.get('email')?.errors?.['required']"
                >Vui lòng nhập email</span
              >
              <span *ngIf="forgotStep1Form.get('email')?.errors?.['pattern']"
                >Email không đúng định dạng (ví dụ: name&#64;gmail.com)</span
              >
            </div>
          </div>

          <div class="btn-group">
            <button type="button" class="btn-back" (click)="setMode('signin')">Quay lại</button>
            <button type="submit" class="btn-submit" [disabled]="loading()">Gửi mã OTP</button>
          </div>
        </form>

        <!-- 4. FORGOT PASSWORD - STEP 2 (Verify OTP) -->
        <form
          *ngIf="mode() === 'forgot_step2'"
          [formGroup]="forgotStep2Form"
          (ngSubmit)="onForgotStep2()"
          class="auth-form"
          novalidate
        >
          <div class="mail-sent-banner">
            <mat-icon>mark_email_read</mat-icon>
            <div>
              <strong>Mã xác thực đã được gửi!</strong>
              <p>
                Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) của <b>{{ resetEmail() }}</b> để
                lấy mã OTP 6 chữ số (hiệu lực 10 phút).
              </p>
            </div>
          </div>

          <div class="form-group" [class.has-error]="isFieldInvalid(forgotStep2Form, 'otp')">
            <label>Nhập mã OTP (6 chữ số) <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>pin</mat-icon>
              <input
                type="text"
                maxlength="6"
                formControlName="otp"
                placeholder="Nhập 6 số trong email"
                autocomplete="one-time-code"
              />
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(forgotStep2Form, 'otp')">
              <span *ngIf="forgotStep2Form.get('otp')?.errors?.['required']"
                >Vui lòng nhập mã OTP</span
              >
              <span *ngIf="forgotStep2Form.get('otp')?.errors?.['pattern']"
                >Mã OTP phải gồm đúng 6 chữ số</span
              >
            </div>
          </div>

          <div class="btn-group">
            <button type="button" class="btn-back" (click)="setMode('forgot_step1')">
              Nhập lại email
            </button>
            <button type="submit" class="btn-submit" [disabled]="loading()">Xác thực OTP</button>
          </div>
        </form>

        <!-- 5. FORGOT PASSWORD - STEP 3 (New Password with Eye Icon) -->
        <form
          *ngIf="mode() === 'forgot_step3'"
          [formGroup]="forgotStep3Form"
          (ngSubmit)="onForgotStep3()"
          class="auth-form"
          novalidate
        >
          <p class="guide-text">
            Xác thực thành công! Vui lòng thiết lập mật khẩu mới cho tài khoản của bạn.
          </p>

          <div
            class="form-group"
            [class.has-error]="isFieldInvalid(forgotStep3Form, 'newPassword')"
          >
            <label>Mật khẩu mới (tối thiểu 6 ký tự) <span class="req-star">*</span></label>
            <div class="input-wrap">
              <mat-icon>lock_reset</mat-icon>
              <input
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="newPassword"
                placeholder="Nhập mật khẩu mới"
                autocomplete="new-password"
              />
              <!-- Nút con mắt hiển thị mật khẩu mới theo yêu cầu -->
              <button
                type="button"
                class="eye-btn"
                (click)="toggleShowNewPassword()"
                title="Ẩn/Hiện mật khẩu mới"
              >
                <mat-icon>{{ showNewPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </div>
            <div class="error-text" *ngIf="isFieldInvalid(forgotStep3Form, 'newPassword')">
              <span *ngIf="forgotStep3Form.get('newPassword')?.errors?.['required']"
                >Vui lòng nhập mật khẩu mới</span
              >
              <span *ngIf="forgotStep3Form.get('newPassword')?.errors?.['minlength']"
                >Mật khẩu mới phải có ít nhất 6 ký tự</span
              >
            </div>
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading()">
            Cập nhật mật khẩu mới
          </button>
        </form>

        <!-- MODAL 1: KÍCH HOẠT LẠI TÀI KHOẢN (KHI SIGN IN) -->
        <div class="recovery-overlay" *ngIf="showReactivateModal()">
          <div class="recovery-modal">
            <div class="modal-icon-circle accent-gold">
              <mat-icon>hourglass_top</mat-icon>
            </div>
            <h3 class="modal-title">Tài khoản đang tạm ngưng</h3>
            <p class="modal-desc">
              Tài khoản <b>{{ reactivateEmail() }}</b> của bạn đang trong thời gian ân hạn 90 ngày sau khi xóa mềm.
              Toàn bộ danh sách Yêu thích ❤️ và Lịch sử đơn hàng vẫn được lưu giữ an toàn.
            </p>
            <div class="modal-box-info">
              <mat-icon>verified</mat-icon>
              <span>Bạn có muốn kích hoạt lại tài khoản ngay bây giờ để tiếp tục sử dụng?</span>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-modal-cancel" (click)="showReactivateModal.set(false)">
                Để sau
              </button>
              <button type="button" class="btn-modal-confirm" (click)="onConfirmReactivate()" [disabled]="loading()">
                {{ loading() ? 'Đang kích hoạt...' : 'Kích hoạt lại ngay' }}
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL 2: PHÁT HIỆN TÀI KHOẢN CŨ (KHI SIGN UP) -->
        <div class="recovery-overlay" *ngIf="showSignUpRecoveryModal()">
          <div class="recovery-modal wide-modal">
            <div class="modal-icon-circle accent-green">
              <mat-icon>account_circle</mat-icon>
            </div>
            <h3 class="modal-title">Phát hiện tài khoản từng tồn tại!</h3>
            <p class="modal-desc">
              Email <b>{{ pendingSignUpData()?.email }}</b> từng có tài khoản trước đây và đang trong thời gian ân hạn 90 ngày. Vui lòng chọn cách bạn muốn tiếp tục:
            </p>

            <!-- Choice step -->
            <div class="recovery-options" *ngIf="signUpRecoveryStep() === 'choose'">
              <div class="option-card featured-option" (click)="onSelectRestoreWithOtp()">
                <div class="opt-badge">Khuyên dùng</div>
                <div class="opt-icon">
                  <mat-icon>history</mat-icon>
                </div>
                <div class="opt-content">
                  <h4>Khôi phục tài khoản cũ</h4>
                  <p>Giữ lại toàn bộ danh sách Món yêu thích ❤️ và Lịch sử đơn hàng cũ. Xác thực an toàn qua mã OTP gửi về email.</p>
                </div>
                <mat-icon class="arrow-icon">chevron_right</mat-icon>
              </div>

              <div class="option-card" (click)="onSelectOverwriteFresh()">
                <div class="opt-icon reset-icon">
                  <mat-icon>refresh</mat-icon>
                </div>
                <div class="opt-content">
                  <h4>Bắt đầu mới hoàn toàn 100%</h4>
                  <p>Làm sạch toàn bộ dữ liệu cũ và khởi tạo một hồ sơ mới tinh với thông tin bạn vừa đăng ký.</p>
                </div>
                <mat-icon class="arrow-icon">chevron_right</mat-icon>
              </div>
            </div>

            <!-- OTP step -->
            <div class="otp-restore-box" *ngIf="signUpRecoveryStep() === 'otp'">
              <div class="mail-sent-banner">
                <mat-icon>mark_email_read</mat-icon>
                <div>
                  <strong>Mã xác thực đã được gửi!</strong>
                  <p>
                    Vui lòng kiểm tra email <b>{{ pendingSignUpData()?.email }}</b> để lấy mã OTP 6 chữ số khôi phục tài khoản (hiệu lực 10 phút).
                  </p>
                </div>
              </div>

              <div class="form-group" style="margin-top: 16px;">
                <label>Nhập mã OTP 6 số <span class="req-star">*</span></label>
                <div class="input-wrap">
                  <mat-icon>pin</mat-icon>
                  <input
                    type="text"
                    [value]="restoreOtpInput()"
                    (input)="restoreOtpInput.set($any($event.target).value)"
                    placeholder="123456"
                    maxlength="6"
                    style="letter-spacing: 4px; font-weight: 700;"
                  />
                </div>
              </div>

              <div class="modal-actions" style="margin-top: 20px;">
                <button type="button" class="btn-modal-cancel" (click)="signUpRecoveryStep.set('choose')">
                  Quay lại
                </button>
                <button type="button" class="btn-modal-confirm" (click)="onConfirmRestoreOtp()" [disabled]="loading() || restoreOtpInput().length !== 6">
                  {{ loading() ? 'Đang khôi phục...' : 'Xác thực & Mở lại tài khoản' }}
                </button>
              </div>
            </div>

            <div class="modal-footer-close" *ngIf="signUpRecoveryStep() === 'choose'">
              <button type="button" class="btn-modal-cancel" (click)="showSignUpRecoveryModal.set(false)">
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        background: radial-gradient(circle at top, #faf6ee 0%, #f2f0eb 100%);
      }
      .auth-card {
        background: #ffffff;
        border-radius: 20px;
        padding: 36px 32px;
        max-width: 440px;
        width: 100%;
        box-shadow:
          0 12px 32px rgba(0, 0, 0, 0.08),
          0 2px 6px rgba(0, 0, 0, 0.04);
        border: 1px solid #edebe9;
      }
      .auth-header {
        text-align: center;
        margin-bottom: 24px;
      }
      .brand-badge {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: #006241;
        color: #ffffff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        box-shadow: 0 4px 12px rgba(0, 98, 65, 0.3);
      }
      .brand-badge mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      .auth-title {
        font-size: 22px;
        font-weight: 800;
        color: #1e3932;
        letter-spacing: -0.01em;
        margin-bottom: 4px;
      }
      .auth-subtitle {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.58);
      }
      .server-error-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border-radius: 10px;
        background: #fde8e7;
        border: 1px solid #f29c95;
        color: #c82014;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 18px;
        animation: fadeIn 0.2s ease-in-out;
      }
      .server-error-banner mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .tab-switcher {
        display: flex;
        background: #f2f0eb;
        border-radius: 50px;
        padding: 4px;
        margin-bottom: 24px;
      }
      .tab-btn {
        flex: 1;
        padding: 8px 16px;
        border: none;
        background: transparent;
        border-radius: 50px;
        font-size: 13px;
        font-weight: 700;
        color: rgba(0, 0, 0, 0.6);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .tab-btn.active {
        background: #ffffff;
        color: #006241;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 18px;
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
      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .link-btn {
        background: none;
        border: none;
        color: #00754a;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }
      .link-btn:hover {
        text-decoration: underline;
      }
      .input-wrap {
        display: flex;
        align-items: center;
        padding: 0 14px;
        height: 48px;
        border-radius: 12px;
        background: #ffffff;
        border: 1.5px solid #d6dbde;
        transition: all 0.2s;
      }
      .input-wrap:focus-within {
        border-color: #00754a;
        box-shadow: 0 0 0 3px rgba(0, 117, 74, 0.15);
      }
      .form-group.has-error .input-wrap {
        border-color: #c82014;
        background: #fffafa;
      }
      .form-group.has-error .input-wrap:focus-within {
        box-shadow: 0 0 0 3px rgba(200, 32, 20, 0.15);
      }
      .input-wrap mat-icon {
        color: rgba(0, 0, 0, 0.4);
        margin-right: 10px;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
      .input-wrap input {
        flex: 1;
        border: none;
        outline: none;
        font-size: 14px;
        font-family: inherit;
        color: #1e3932;
        background: transparent;
      }
      .eye-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        padding: 4px;
      }
      .eye-btn:hover {
        color: #1e3932;
      }
      .error-text {
        font-size: 11.5px;
        color: #c82014;
        font-weight: 600;
        line-height: 1.3;
        padding-left: 2px;
      }
      .btn-submit {
        margin-top: 6px;
        padding: 13px 24px;
        border-radius: 50px;
        background: #00754a;
        color: #ffffff;
        border: none;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 117, 74, 0.3);
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .btn-submit:hover:not(:disabled) {
        background: #005c3b;
        transform: translateY(-1px);
      }
      .btn-submit:active:not(:disabled) {
        transform: scale(0.98);
      }
      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        box-shadow: none;
      }
      .btn-group {
        display: flex;
        gap: 12px;
        margin-top: 8px;
      }
      .btn-back {
        padding: 12px 20px;
        border-radius: 50px;
        background: #edebe9;
        color: rgba(0, 0, 0, 0.87);
        border: none;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-back:hover {
        background: #e0dedc;
      }
      .guide-text {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.65);
        line-height: 1.5;
      }
      .mail-sent-banner {
        display: flex;
        gap: 12px;
        padding: 14px 16px;
        background: #faf6ee;
        border: 1.5px dashed #cba258;
        border-radius: 12px;
        color: #1e3932;
        align-items: flex-start;
      }
      .mail-sent-banner mat-icon {
        color: #00754a;
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .mail-sent-banner strong {
        font-size: 14px;
        display: block;
        margin-bottom: 4px;
        color: #00754a;
      }
      .mail-sent-banner p {
        font-size: 12.5px;
        color: rgba(0, 0, 0, 0.7);
        line-height: 1.45;
        margin: 0;
      }

      /* RECOVERY MODALS */
      .recovery-overlay {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        animation: fadeInOverlay 0.25s ease-out;
      }
      @keyframes fadeInOverlay {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .recovery-modal {
        background: #ffffff;
        border-radius: 24px;
        padding: 32px 28px;
        max-width: 440px;
        width: 100%;
        text-align: center;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
        animation: slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .wide-modal {
        max-width: 520px;
      }
      @keyframes slideUpModal {
        from { opacity: 0; transform: translateY(20px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .modal-icon-circle {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .modal-icon-circle mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
      .accent-gold {
        background: #faf6ee;
        color: #b4852e;
        border: 2px solid #cba258;
      }
      .accent-green {
        background: #e6f4ea;
        color: #00754a;
        border: 2px solid #00754a;
      }
      .modal-title {
        font-size: 20px;
        font-weight: 800;
        color: #1e3932;
        margin: 0 0 8px;
      }
      .modal-desc {
        font-size: 13.5px;
        color: rgba(0, 0, 0, 0.7);
        line-height: 1.5;
        margin: 0 0 20px;
      }
      .modal-box-info {
        background: #f4f9f4;
        border: 1px solid #c3e6cb;
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        gap: 10px;
        align-items: center;
        text-align: left;
        font-size: 13px;
        color: #1e3932;
        margin-bottom: 24px;
      }
      .modal-box-info mat-icon {
        color: #00754a;
        font-size: 20px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }
      .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
      .btn-modal-cancel {
        padding: 12px 22px;
        border-radius: 50px;
        background: #edebe9;
        color: #333333;
        font-size: 14px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-modal-cancel:hover {
        background: #e0dedc;
      }
      .btn-modal-confirm {
        padding: 12px 26px;
        border-radius: 50px;
        background: #00754a;
        color: #ffffff;
        font-size: 14px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0, 117, 74, 0.35);
        transition: all 0.2s;
      }
      .btn-modal-confirm:hover:not(:disabled) {
        background: #005c3b;
        transform: translateY(-1px);
      }
      .btn-modal-confirm:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .recovery-options {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
        text-align: left;
      }
      .option-card {
        position: relative;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        border-radius: 16px;
        border: 1.5px solid #edebe9;
        background: #ffffff;
        cursor: pointer;
        transition: all 0.2s;
      }
      .option-card:hover {
        border-color: #00754a;
        background: #f9fcfb;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
      }
      .featured-option {
        border-color: #00754a;
        background: linear-gradient(135deg, #f4fbf7 0%, #ffffff 100%);
      }
      .opt-badge {
        position: absolute;
        top: -9px;
        right: 16px;
        background: #00754a;
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        padding: 2px 8px;
        border-radius: 10px;
        letter-spacing: 0.5px;
      }
      .opt-icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: #e6f4ea;
        color: #00754a;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .opt-icon.reset-icon {
        background: #f0f0f0;
        color: #666666;
      }
      .opt-content h4 {
        font-size: 14.5px;
        font-weight: 700;
        color: #1e3932;
        margin: 0 0 2px;
      }
      .opt-content p {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.65);
        margin: 0;
        line-height: 1.4;
      }
      .arrow-icon {
        color: #aaa;
        margin-left: auto;
      }
      .modal-footer-close {
        margin-top: 12px;
      }
    `,
  ],
})
export class AuthComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode = signal<AuthMode>('signin');
  showPassword = signal<boolean>(false);
  showNewPassword = signal<boolean>(false);
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Password reset flow state
  resetEmail = signal<string>('');
  resetToken = signal<string>('');

  // Reactivate modal signals
  showReactivateModal = signal<boolean>(false);
  reactivateEmail = signal<string>('');
  reactivatePassword = signal<string>('');

  // SignUp recovery modal signals
  showSignUpRecoveryModal = signal<boolean>(false);
  signUpRecoveryStep = signal<'choose' | 'otp'>('choose');
  pendingSignUpData = signal<{ name: string; email: string; password: string } | null>(null);
  restoreOtpInput = signal<string>('');

  signInForm = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  signUpForm = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const pass = group.get('password')?.value;
        const confirm = group.get('confirmPassword')?.value;
        return pass === confirm ? null : { passwordMismatch: true };
      },
    },
  );

  forgotStep1Form = this.fb.group({
    email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
  });

  forgotStep2Form = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
  });

  forgotStep3Form = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  setMode(newMode: AuthMode) {
    this.mode.set(newMode);
    this.errorMessage.set('');
    this.showPassword.set(false);
    this.showNewPassword.set(false);
  }

  toggleShowPassword() {
    this.showPassword.update((v) => !v);
  }

  toggleShowNewPassword() {
    this.showNewPassword.update((v) => !v);
  }

  isFieldInvalid(form: any, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control && control.touched && control.invalid);
  }

  getHeaderTitle(): string {
    switch (this.mode()) {
      case 'signin':
        return 'Đăng nhập Starbucks';
      case 'signup':
        return 'Tạo tài khoản mới';
      case 'forgot_step1':
        return 'Quên mật khẩu';
      case 'forgot_step2':
        return 'Nhập mã OTP';
      case 'forgot_step3':
        return 'Thiết lập mật khẩu mới';
    }
  }

  getHeaderSubtitle(): string {
    switch (this.mode()) {
      case 'signin':
        return 'Đăng nhập để đặt món & nhận ưu đãi';
      case 'signup':
        return 'Tham gia cộng đồng thưởng thức trà sữa & cà phê';
      case 'forgot_step1':
        return 'Khôi phục quyền truy cập vào tài khoản của bạn';
      case 'forgot_step2':
        return 'Xác thực mã bảo mật 6 chữ số gửi qua email';
      case 'forgot_step3':
        return 'Thiết lập mật khẩu an toàn mới';
    }
  }

  onSignIn() {
    this.markAllTouched(this.signInForm);
    if (this.signInForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    const { email, password } = this.signInForm.value;

    this.authService.signIn({ email: email!.trim(), password: password! }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res && res.isDeactivatedAccount) {
          this.reactivateEmail.set(email!.trim());
          this.reactivatePassword.set(password!);
          this.showReactivateModal.set(true);
          return;
        }
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/menu';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Email hoặc mật khẩu không chính xác';
        this.errorMessage.set(msg);
      },
    });
  }

  onSignUp() {
    this.markAllTouched(this.signUpForm);
    if (this.signUpForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    const { name, email, password } = this.signUpForm.value;

    this.authService
      .signUp({ name: name!.trim(), email: email!.trim(), password: password! })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res && res.isDeactivatedAccount) {
            this.pendingSignUpData.set({
              name: name!.trim(),
              email: email!.trim(),
              password: password!,
            });
            this.signUpRecoveryStep.set('choose');
            this.restoreOtpInput.set('');
            this.showSignUpRecoveryModal.set(true);
            return;
          }
          this.toast.success('Đăng ký tài khoản thành công!');
          this.router.navigate(['/menu']);
        },
        error: (err) => {
          this.loading.set(false);
          const msg = err.error?.message || 'Không thể tạo tài khoản, vui lòng thử lại';
          this.errorMessage.set(msg);
        },
      });
  }

  onConfirmReactivate() {
    this.loading.set(true);
    this.authService
      .reactivateAccount({
        email: this.reactivateEmail(),
        password: this.reactivatePassword(),
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.showReactivateModal.set(false);
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/menu';
          this.router.navigateByUrl(returnUrl);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Không thể kích hoạt lại tài khoản');
        },
      });
  }

  onSelectRestoreWithOtp() {
    const data = this.pendingSignUpData();
    if (!data) return;

    this.loading.set(true);
    this.authService.sendRestoreOtp(data.email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(res.message);
        this.signUpRecoveryStep.set('otp');
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Không thể gửi mã OTP khôi phục');
      },
    });
  }

  onConfirmRestoreOtp() {
    const data = this.pendingSignUpData();
    const otp = this.restoreOtpInput().trim();
    if (!data || !otp) return;

    this.loading.set(true);
    this.authService
      .confirmRestoreOtp({
        email: data.email,
        otp,
        newPassword: data.password,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.showSignUpRecoveryModal.set(false);
          this.router.navigate(['/menu']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
        },
      });
  }

  onSelectOverwriteFresh() {
    const data = this.pendingSignUpData();
    if (!data) return;

    this.loading.set(true);
    this.authService
      .overwriteAccount({
        name: data.name,
        email: data.email,
        password: data.password,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.showSignUpRecoveryModal.set(false);
          this.router.navigate(['/menu']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'Không thể tạo mới tài khoản');
        },
      });
  }

  onForgotStep1() {
    this.markAllTouched(this.forgotStep1Form);
    if (this.forgotStep1Form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    const email = this.forgotStep1Form.value.email!.trim();

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.resetEmail.set(email);
        this.toast.success(res.message);
        this.setMode('forgot_step2');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Email chưa được đăng ký trong hệ thống';
        this.errorMessage.set(msg);
      },
    });
  }

  onForgotStep2() {
    this.markAllTouched(this.forgotStep2Form);
    if (this.forgotStep2Form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    const otp = this.forgotStep2Form.value.otp!.trim();

    this.authService.verifyOtp(this.resetEmail(), otp).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.resetToken.set(res.resetToken);
        this.toast.success(res.message);
        this.setMode('forgot_step3');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn';
        this.errorMessage.set(msg);
      },
    });
  }

  onForgotStep3() {
    this.markAllTouched(this.forgotStep3Form);
    if (this.forgotStep3Form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set('');
    const newPassword = this.forgotStep3Form.value.newPassword!;

    this.authService.resetPassword({ resetToken: this.resetToken(), newPassword }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(res.message || 'Cập nhật mật khẩu mới thành công! Hãy đăng nhập');
        this.setMode('signin');
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'Không thể cập nhật mật khẩu mới, vui lòng thử lại';
        this.errorMessage.set(msg);
      },
    });
  }

  private markAllTouched(form: any) {
    Object.values(form.controls).forEach((ctrl: any) => {
      ctrl.markAsTouched();
    });
  }
}
