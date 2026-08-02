import { Component, computed, signal} from '@angular/core';
import { MOCK_DRINKS} from '../mock-drinks';
import { DrinkModel } from '../models';
import { DrinkDetail } from "../drink-detail/drink-detail";
@Component({
  selector: 'app-drink-list',
  imports: [DrinkDetail],
  templateUrl: './drink-list.html',
  styleUrl: './drink-list.css',
})
export class DrinkList {
  protected readonly drinks = signal<DrinkModel[]>(MOCK_DRINKS);
  protected readonly chonTraSua = signal<DrinkModel >(MOCK_DRINKS[0]);
  protected chonTranChau():void{
        this.chonTraSua.set(MOCK_DRINKS[0]);
  }

  protected chonMatcha():void{
        this.chonTraSua.set(MOCK_DRINKS[1]);
  }
  protected chonHongTra():void{
        this.chonTraSua.set(MOCK_DRINKS[2]);
  }
  protected chonDrink(drink: DrinkModel): void{
    this.chonTraSua.set(drink);
  }
  protected readonly maxPrice = computed(()=> {
    return Math.max(...this.drinks().map((drink)=>drink.giaCoBan))
  })
}
