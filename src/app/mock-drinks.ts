import { DrinkModel } from "./models";

export const MOCK_DRINKS: DrinkModel[] = [
    {
        id: 1,
        name: "Trà sữa trân châu đường đen",
        description: "thom ngon dam vi tra sua",
        giaCoBan: 30000,
        imgUrl: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=600",
        isPopular: true,
        toppings: [
            {name: "Trân châu đường đen", quantity: 1, unit: "cục"},
            {name: "Pudding", quantity: 2, unit: "cái"},
            {name: "Trân châu trắng", quantity: 3, unit: "cái"},
        ]
    },
    {
        id: 2,
        name: "Trà sữa Matcha",
        description: "Nước mía nguyên chất",
        giaCoBan: 40000,
        imgUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600",
        isPopular: true,
        toppings: [ 
            {name: "Trân châu đường đen", quantity: 4, unit: "cục"},
            {name: "Pudding", quantity: 5, unit: "cái"},
            {name: "Trân châu trắng", quantity: 6, unit: "cái"},
        ]
    },
    {
        id: 3,
        name: "Hồng trà sữa",
        description: "Nước mía nguyên chất",
        giaCoBan: 50000,
        imgUrl: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600",
        isPopular: false,
        toppings: [
            {name: "Trân châu đường đen", quantity: 7, unit: "cục"},
            {name: "Pudding", quantity: 8, unit: "cái"},
            {name: "Trân châu trắng", quantity: 9, unit: "cái"},
        ]
    }
]