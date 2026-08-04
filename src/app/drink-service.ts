import { Injectable, signal } from '@angular/core';
import { DrinkModel } from './models';
import { MOCK_DRINKS } from './mock-drinks';

@Injectable({
  providedIn: 'root',
})
export class DrinkService {
  private readonly drinksState = signal<DrinkModel[]>(MOCK_DRINKS);

  readonly drinks = this.drinksState.asReadonly();

  getDrinkById(id: number): DrinkModel | undefined {
    return this.drinksState().find((drink) => drink.id === id);
  }

  addDrink(newDrink: DrinkModel): void {
    this.drinksState.update((drinks) => [...drinks, newDrink]);
  }

  AddDrink(newDrink: DrinkModel): void {
    this.addDrink(newDrink);
  }

  deleteDrink(id: number): void {
    this.drinksState.update((drinks) => drinks.filter((d) => d.id !== id));
  }

  toggleFavorite(id: number): void {
    this.drinksState.update((drinks) =>
      drinks.map((d) => (d.id === id ? { ...d, isPopular: !d.isPopular } : d))
    );
  }
}

