import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.component.html',
  styleUrl: './loading-skeleton.component.css',
})
export class LoadingSkeletonComponent {
  @Input() count = 3;
  get items(): number[] {
    return Array.from({ length: this.count });
  }
}
