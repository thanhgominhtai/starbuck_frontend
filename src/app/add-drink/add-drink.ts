import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrinkService } from '../drink-service';
import { Router, RouterLink } from '@angular/router';
import { DrinkModel } from '../models';

@Component({
  selector: 'app-add-drink',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-drink.html',
  styleUrl: './add-drink.css',
})
export class AddDrink {
  private readonly fb = inject(FormBuilder);
  private readonly drinkservice = inject(DrinkService);
  private readonly router = inject(Router);
  
  protected readonly drinkForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    giaCoBan: [30000, [Validators.required, Validators.min(10000)]]
    
  })
  protected save(): void {
    if(this.drinkForm.invalid){
      this.drinkForm.markAllAsTouched();
      return;
    }
    const {name, description, giaCoBan} = this.drinkForm.getRawValue();
    const currentDrinks = this.drinkservice.drinks();
    const masId = currentDrinks.length > 0 ? Math.max(...currentDrinks.map(d=>d.id)):0;
    const newDrink: DrinkModel={
      id: masId + 1,
      name,
      description,
      giaCoBan,
      imgUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
      isPopular: false,
      toppings: []
    }
    this.drinkservice.AddDrink(newDrink);
    this.router.navigate(['/drinks']);
  }
  
}
