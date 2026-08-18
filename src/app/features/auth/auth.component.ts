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
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
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
