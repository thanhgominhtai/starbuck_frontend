import { Component, signal } from '@angular/core';
import { DrinkList } from './drink-list/drink-list';
@Component({
  selector: 'app-root',
  imports: [DrinkList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly tenQuan = signal('Nước mía cô 12');
}
