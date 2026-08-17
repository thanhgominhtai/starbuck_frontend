import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DrinkModel } from './models';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DrinkService {
  // Tiêm "ống hút" dữ liệu từ thư viện Angular
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/drinks`;

  // Khởi tạo danh sách bằng mảng rỗng (thay vì MOCK_DRINKS)
  private readonly drinksState = signal<DrinkModel[]>([]);
  readonly drinks = this.drinksState.asReadonly();

  // Ngay khi Service khởi tạo, tự động gọi hàm lấy dữ liệu
  constructor() {
    this.loadDrinksFromApi();
  }

  // 1. LẤY DỮ LIỆU TỪ NESTJS
  private loadDrinksFromApi() {
    this.http.get<DrinkModel[]>(this.API_URL).subscribe((data) => {
      // Khi dữ liệu về, cập nhật lại Signal
      this.drinksState.set(data);
    });
  }

  getDrinkById(id: string): DrinkModel | undefined {
    return this.drinksState().find((drink) => drink.id === id);
  }

  // 2. TẠO MỚI (GỬI LÊN NESTJS RỒI MỚI CẬP NHẬT GIAO DIỆN)
  addDrink(newDrink: DrinkModel): void {
    // Không đẩy ID giả từ FE lên nữa, để NestJS tự tạo
    const { id, ...drinkData } = newDrink;

    this.http.post<DrinkModel>(this.API_URL, drinkData).subscribe((createdDrink) => {
      // Backend lưu xong trả về món mới, ta nhét nó vào Signal
      this.drinksState.update((drinks) => [...drinks, createdDrink]);
    });
  }

  // Bổ sung hàm AddDrink viết hoa (do code cũ của bạn có hàm này)
  AddDrink(newDrink: DrinkModel): void {
    this.addDrink(newDrink);
  }

  // 3. XÓA MÓN
  deleteDrink(id: string): void {
    this.http.delete(`${this.API_URL}/${id}`).subscribe(() => {
      this.drinksState.update((drinks) => drinks.filter((d) => d.id !== id));
    });
  }

  // 4. CHỈNH SỬA (VÍ DỤ: YÊU THÍCH)
  toggleFavorite(id: string): void {
    // Cập nhật giao diện trước cho ngầu
    this.drinksState.update((drinks) =>
      drinks.map((d) => (d.id === id ? { ...d, isPopular: !d.isPopular } : d)),
    );

    // Gửi ngầm lên API để lưu vĩnh viễn trạng thái đó
    const drink = this.getDrinkById(id);
    if (drink) {
      this.http.patch(`${this.API_URL}/${id}`, { isPopular: !drink.isPopular }).subscribe();
    }
  }
}
