import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { SidebarService } from './core/services/sidebar.service';
import { AuthService } from './core/services/auth.service';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarComponent,
    ToastContainerComponent,
    MatIconModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  public sidebarService = inject(SidebarService);

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.authService.getProfile().subscribe({
        next: () => {},
        error: () => {},
      });
    }
  }

  isAuthPage(): boolean {
    return this.router.url.startsWith('/auth');
  }
}
