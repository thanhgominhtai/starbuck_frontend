// 💡 GIẢI THÍCH: Interface mô tả cấu trúc dữ liệu của 1 Topping đi kèm
export interface Topping {
  name: string; // Tên của topping (ví dụ: Trân châu đường đen)
  quantity: number; // Số lượng topping
  unit: string; // Đơn vị tính (ví dụ: cục, cái, phần)
}

// 💡 GIẢI THÍCH: Interface mô tả cấu trúc dữ liệu của 1 món trà sữa trong hệ thống
export interface DrinkModel {
  id: string; // Mã số định danh duy nhất của món trà
  name: string; // Tên món trà sữa
  description: string; // Mô tả hương vị chi tiết
  giaCoBan: number; // Giá gốc kiểu số (ví dụ: 30000)
  imgUrl: string; // URL đường dẫn hình ảnh món trà
  isPopular: boolean; // Đánh dấu món trà có HOT/phổ biến hay không
  authorEmail: string; // 💡 C18: Email người tạo/tác giả món trà
  toppings: Topping[]; // Danh sách các topping đi kèm
}
