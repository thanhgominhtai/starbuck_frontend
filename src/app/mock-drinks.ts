import { DrinkModel } from "./models";

// 💡 GIẢI THÍCH: Dữ liệu khởi tạo mẫu gồm 3 món trà sữa có điền đủ thông tin authorEmail
export const MOCK_DRINKS: DrinkModel[] = [
    {
        id: 1,
        name: "Trà sữa trân châu đường đen",
        description: "Thơm ngon đậm vị trà sữa truyền thống",
        giaCoBan: 30000,
        imgUrl: "https://images.unsplash.com/photo-1558857563-b371033873b8?w=600",
        isPopular: true,
        authorEmail: "admin@trasua.com", // 💡 C18: Email tác giả món 1
        toppings: [
            {name: "Trân châu đường đen", quantity: 1, unit: "cục"},
            {name: "Pudding", quantity: 2, unit: "cái"},
            {name: "Trân châu trắng", quantity: 3, unit: "cái"},
        ]
    },
    {
        id: 2,
        name: "Trà sữa Matcha",
        description: "Hương vị Matcha Nhật Bản tươi mát",
        giaCoBan: 40000,
        imgUrl: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600",
        isPopular: true,
        authorEmail: "barista@trasua.com", // 💡 C18: Email tác giả món 2
        toppings: [ 
            {name: "Trân châu đường đen", quantity: 4, unit: "cục"},
            {name: "Pudding", quantity: 5, unit: "cái"},
            {name: "Trân châu trắng", quantity: 6, unit: "cái"},
        ]
    },
    {
        id: 3,
        name: "Hồng trà sữa",
        description: "Đậm đà hương vị hồng trà cổ điển",
        giaCoBan: 50000,
        imgUrl: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=600",
        isPopular: false,
        authorEmail: "manager@trasua.com", // 💡 C18: Email tác giả món 3
        toppings: [
            {name: "Trân châu đường đen", quantity: 7, unit: "cục"},
            {name: "Pudding", quantity: 8, unit: "cái"},
            {name: "Trân châu trắng", quantity: 9, unit: "cái"},
        ]
    }
];