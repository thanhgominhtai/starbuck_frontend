import { Routes } from '@angular/router';
import { DrinkDetail } from './drink-detail/drink-detail';
import { DrinkList } from './drink-list/drink-list';
import { AddDrink } from './add-drink/add-drink';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
    {path:"drinks", component: DrinkList},
    {path:"drinks/new", component: AddDrink},
    {path:"drinks/:id", component: DrinkDetail},
    {path:"", redirectTo:"drinks", pathMatch:"full"},
    {path:"**", component: NotFound}
];
