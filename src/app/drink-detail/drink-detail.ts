import { Component, computed, input, signal } from '@angular/core';
import { DrinkModel } from '../models';
import { JsonPipe, DecimalPipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-drink-detail',
  imports: [JsonPipe, DecimalPipe, NgClass],
  templateUrl: './drink-detail.html',
  styleUrl: './drink-detail.css',
})
export class DrinkDetail {
  readonly drink = input.required<DrinkModel>();
  readonly soLy = signal<number>(0);

  protected tangSoLy(): void {
    this.soLy.update((n) => n + 1);
  }
  protected giamSoLy(): void {
    this.soLy.update((n) => n - 1);
  }
  protected giamgia = computed(()=>{
    let gia: number = this.drink()?.giaCoBan ?? 0;
    if(this.soLy() >= 5){
      gia = gia * 0.1;
      return gia;
    }else{
      return 0;
    }
  })  
  protected tongTien = computed(() => {
    if(this.soLy() >= 5){
      return (this.drink()?.giaCoBan ?? 0) * this.soLy() - this.giamgia();
    }
    return (this.drink()?.giaCoBan ?? 0) * this.soLy();
  });

  protected toppingCanDung = computed(() => {
    return (
      this.drink()?.toppings.map((topping) => ({
        ...topping,
        quantity: topping.quantity * this.soLy(),
      })) ?? []
    );
  });
  protected tongSoTopping = computed(() => {
    return this.toppingCanDung().reduce((sum, item) => sum + item.quantity, 0);
  });
}
