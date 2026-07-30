import { Component, signal, computed, } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { MOCK_DRINKS } from './mock-drinks';
import { DrinkModel } from './models';
import { JsonPipe,DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [JsonPipe,DecimalPipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly tenQuan = signal('Nước mía cô 12');

  protected readonly drinks: DrinkModel[] = MOCK_DRINKS;
  protected readonly chonTraSua = signal<DrinkModel | null>(null);
  protected chonTranChau():void{
        this.chonTraSua.set(this.drinks[0]);
  }

  protected chonMatcha():void{
        this.chonTraSua.set(this.drinks[1]);
  }
  protected chonHongTra():void{
        this.chonTraSua.set(this.drinks[2]);
  }
  protected readonly soLy = signal<number>(0);

  protected tangSoLy(): void {
    this.soLy.update((n) => n + 1);
  }
  protected giamSoLy(): void {
    this.soLy.update((n) => n - 1);
  }
  protected giamgia = computed(()=>{
    let gia: number = this.chonTraSua()?.giaCoBan ?? 0;
    if(this.soLy() >= 5){
      gia = gia * 0.1;
      return gia;
    }else{
      return 0;
    }
  })  
  protected tongTien = computed(() => {
    if(this.soLy() >= 5){
      return (this.chonTraSua()?.giaCoBan ?? 0) * this.soLy() - this.giamgia();
    }
    return (this.chonTraSua()?.giaCoBan ?? 0) * this.soLy();
  });

  protected toppingCanDung = computed(() => {
    return this.chonTraSua()?.toppings.map((topping) => {
      return { name:topping.name, quantity: topping.quantity, unit:topping.unit };
    });
  });
  protected tongSoTopping = computed(() => {
    return this.chonTraSua()?.toppings.reduce((tong, topping) => tong + topping.quantity, 0);
  });
}
