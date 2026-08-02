export interface Topping {
    name: string;
    quantity: number;
    unit: string;
}
export interface DrinkModel {
    id: number;
    name: string;
    description: string;
    giaCoBan: number;
    imgUrl: string;
    isPopular: boolean;
    toppings: Topping[];
}