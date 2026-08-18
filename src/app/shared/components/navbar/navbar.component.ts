import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeSseService } from '../../../core/services/realtime-sse.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  public authService = inject(AuthService);
  public sseService = inject(RealtimeSseService);
  private router = inject(Router);

  isAuthPage(): boolean {
    return this.router.url.startsWith('/auth') || this.router.url === '/';
  }
}
