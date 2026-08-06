import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

// 💡 D1: BreakpointObserver từ Angular CDK nhận biết kích thước màn hình Mobile hay Desktop
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { MatToolbarModule } from '@angular/material/toolbar'; // 💡 M3-1: Module thanh Top App Bar
import { MatSidenavModule } from '@angular/material/sidenav'; // 💡 M3-1: Module khung Navigation Drawer
import { MatListModule } from '@angular/material/list';       // 💡 Module danh sách mat-nav-list
import { MatIconModule } from '@angular/material/icon';       // 💡 Module hiển thị icon mat-icon
import { MatButtonModule } from '@angular/material/button';   // 💡 Module nút matButton và matFab
import { MatDividerModule } from '@angular/material/divider'; // 💡 Module gạch ngang phân cách

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,          // 💡 Thẻ nạp component theo URL (<router-outlet>)
    RouterLink,            // 💡 Directive chuyển đường dẫn (routerLink)
    RouterLinkActive,      // 💡 Directive tô sáng link khi URL trùng (routerLinkActive)
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // 💡 D1: Inject dịch vụ lắng nghe kích thước màn hình
  private readonly breakpointObserver = inject(BreakpointObserver);

  // 💡 D1: Signal ghi nhớ trạng thái màn hình có phải là Mobile (Handset) không
  protected readonly isHandset = signal(false);

  constructor() {
    // 💡 D1: Lắng nghe khi màn hình nhỏ hơn 768px -> set isHandset = true để tự đổi mode drawer sang 'over'
    this.breakpointObserver
      .observe([Breakpoints.Handset, '(max-width: 768px)'])
      .subscribe((result) => {
        this.isHandset.set(result.matches);
      });
  }
}
