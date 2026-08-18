import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  public authService = inject(AuthService);
  public sidebarService = inject(SidebarService);
  private router = inject(Router);

  isExpanded = this.sidebarService.isExpanded;
  isPinned = this.sidebarService.isPinned;

  onMouseEnter() {
    this.sidebarService.setHover(true);
  }

  onMouseLeave() {
    this.sidebarService.setHover(false);
  }

  togglePin(event: MouseEvent) {
    this.sidebarService.togglePin(event);
  }

  isAuthPage(): boolean {
    return this.router.url.startsWith('/auth');
  }
}
