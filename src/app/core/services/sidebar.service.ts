import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  isHovered = signal<boolean>(false);
  isPinned = signal<boolean>(false);

  // Expanded when either hovered or pinned
  isExpanded = computed(() => this.isHovered() || this.isPinned());

  setHover(hovered: boolean) {
    this.isHovered.set(hovered);
  }

  togglePin(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.isPinned.update((p) => !p);
  }

  collapse() {
    this.isHovered.set(false);
    this.isPinned.set(false);
  }
}
