export interface RecipeTopping {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  giaCoBan: number;
  imgUrl: string;
  isPopular: boolean;
  isSpecial?: boolean;
  category: string;
  authorEmail?: string;
  toppings: RecipeTopping[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRecipeDto {
  name: string;
  description: string;
  giaCoBan: number;
  imgUrl: string;
  isPopular?: boolean;
  isSpecial?: boolean;
  category?: string;
  toppings?: RecipeTopping[];
}
