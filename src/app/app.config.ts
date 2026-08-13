import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
// 💡 GIẢI THÍCH: provideAnimationsAsync kích hoạt hiệu ứng chuyển động bất đồng bộ cho Material 21
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// 💡 GIẢI THÍCH: MAT_ICON_DEFAULT_OPTIONS dùng cài đặt kiểu icon mặc định cho thẻ <mat-icon>
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), // Lắng nghe lỗi toàn cục của trình duyệt
    provideRouter(routes), // Cấu hình các đường dẫn ứng dụng
    provideAnimationsAsync(), // 💡 Bật Animation mượt mà cho Material Components

    // 💡 Đặt fontSet mặc định là 'material-symbols-outlined' để các thẻ <mat-icon> hiển thị đẹp mắt
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
  ],
};
