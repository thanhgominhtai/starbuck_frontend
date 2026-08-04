# HƯỚNG DẪN CHI TIẾT BÀI TẬP VỀ NHÀ (BÀI 13 → 16)
> **Phạm vi kiến thức**: Giai đoạn 4 — Two-Way Binding, Services & DI, Routing, Reactive Forms & Thử thách Nâng cao.  
> **Mục đích**: Tài liệu hướng dẫn step-by-step (theo đúng trình tự PDF `BAI-TAP-VE-NHA-13-16.md`), nêu rõ sửa ở đâu, viết code gì và giải thích chi tiết để bạn tự triển khai.

---

## PHẦN C — PROJECT QUẦY TRÀ SỮA

---

### 🟢 Nhiệm vụ C13 — Ôn Bài 13: Two-Way Binding & Lọc Tìm Kiếm

#### 1. Mục đích & Yêu cầu
- Thêm ô tìm kiếm từ khóa phía trên danh sách trà sữa.
- Sử dụng Two-Way Binding với Signal: `[ngModel]="keyword()"` và `(ngModelChange)="keyword.set($event)"`.
- Tạo một `computed` tên `filteredDrinks` để lọc danh sách món theo từ khóa:
  - Không phân biệt chữ hoa / chữ thường (`.toLowerCase()`).
  - Bỏ qua khoảng trắng thừa hai đầu (`.trim()`).
  - Khi ô tìm kiếm trống, tự động hiển thị lại tất cả món.
  - Sử dụng khối `@empty` trong HTML khi không tìm thấy món nào.

#### 2. Các file cần chỉnh sửa
1. `src/app/drink-list/drink-list.ts`
2. `src/app/drink-list/drink-list.html`
3. `src/app/drink-list/drink-list.css`

#### 3. Hướng dẫn thực hiện chi tiết

##### **Bước 1: Chỉnh sửa `src/app/drink-list/drink-list.ts`**
- Import `FormsModule` từ `@angular/forms` và thêm vào mảng `imports` của `@Component`.
- Khai báo Signal ghi nhớ từ khóa tìm kiếm: `protected readonly keyword = signal<string>('');`.
- Khai báo Computed lọc danh sách: `protected readonly filteredDrinks = computed(...)`.

```typescript
// File: src/app/drink-list/drink-list.ts
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms'; // 1. Import FormsModule để dùng [ngModel]
import { MOCK_DRINKS } from '../mock-drinks';
import { DrinkModel } from '../models';
import { DrinkDetail } from '../drink-detail/drink-detail';

@Component({
  selector: 'app-drink-list',
  imports: [DrinkDetail, FormsModule], // 2. Thêm FormsModule vào mảng imports
  templateUrl: './drink-list.html',
  styleUrl: './drink-list.css',
})
export class DrinkList {
  protected readonly drinks = signal<DrinkModel[]>(MOCK_DRINKS);
  protected readonly chonTraSua = signal<DrinkModel>(MOCK_DRINKS[0]);

  // 3. State ghi nhớ từ khóa nhập vào
  protected readonly keyword = signal<string>('');

  // 4. Computed tính toán danh sách đã qua bộ lọc từ khóa
  protected readonly filteredDrinks = computed(() => {
    const key = this.keyword().toLowerCase().trim();
    if (!key) {
      return this.drinks(); // Nếu ô trống, trả về tất cả
    }
    return this.drinks().filter((drink) =>
      drink.name.toLowerCase().includes(key)
    );
  });

  protected chonDrink(drink: DrinkModel): void {
    this.chonTraSua.set(drink);
  }

  protected readonly maxPrice = computed(() => {
    return Math.max(...this.drinks().map((drink) => drink.giaCoBan));
  });
}
```

##### **Bước 2: Chỉnh sửa `src/app/drink-list/drink-list.html`**
- Thêm `<label>` có thuộc tính `for="search"` liên kết với `id="search"` của ô `<input>`.
- Dùng cú pháp `[ngModel]="keyword()"` và `(ngModelChange)="keyword.set($event)"`.
- Thay đổi vòng lặp `@for`: lặp qua `filteredDrinks()` thay vì `drinks()`.
- Thêm khối `@empty` để thông báo khi không có món khớp.

```html
<!-- File: src/app/drink-list/drink-list.html -->
<div class="search-box">
  <label for="search">Tìm kiếm món trà sữa:</label>
  <input
    id="search"
    type="search"
    [ngModel]="keyword()"
    (ngModelChange)="keyword.set($event)"
    placeholder="Nhập từ khóa tìm kiếm..."
  />
</div>

<hr />

@for (item of filteredDrinks(); track item.id) {
  <button
    type="button"
    [class.is-active]="item.id === chonTraSua().id"
    (click)="chonDrink(item)"
  >
    {{ item.name }}
    @if (item.isPopular) {
      <span aria-label="Món phổ biến">🔥</span>
    }
    @if (item.giaCoBan === maxPrice()) {
      <span aria-label="Món đắt nhất">💎</span>
    }
  </button>
} @empty {
  <p class="empty-message">Không tìm thấy món nào khớp với từ khóa.</p>
}

<hr />
<app-drink-detail [drink]="chonTraSua()"></app-drink-detail>
```

##### **Bước 3: Thêm CSS cho C13 vào `src/app/drink-list/drink-list.css`**
```css
/* File: src/app/drink-list/drink-list.css */
.search-box {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1rem;
}

.search-box label {
  font-size: 0.875rem;
  color: var(--chu-nhat, #6b6259);
  font-weight: 600;
}

.search-box input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--kem-dam, #f0e2c8);
  border-radius: 6px;
  box-sizing: border-box; /* Bắt buộc để padding không làm tràn width 100% */
  font-family: inherit;
  font-size: 1rem;
}

.search-box input:focus {
  outline: 2px solid var(--cam, #d2683a);
  outline-offset: 1px;
}

.empty-message {
  color: var(--chu-nhat, #6b6259);
  font-style: italic;
  padding: 1rem 0;
}
```

> ⚠️ **Lưu ý bẫy cần tránh (Trang 15 PDF)**:
> - Cú pháp gộp `[(ngModel)]` **KHÔNG** dùng trực tiếp được với Signal vì Signal cần gọi `.set($event)`. Phải tách thành `[ngModel]="keyword()"` + `(ngModelChange)="keyword.set($event)"`.
> - Nếu lọc ở file `.ts` nhưng ở file `.html` vẫn `@for (item of drinks())` thì giao diện sẽ không thay đổi khi gõ tìm kiếm. Phải đổi thành `@for (item of filteredDrinks())`.

---

### 🔵 Nhiệm vụ C14 — Ôn Bài 14: Services & Dependency Injection (DI)

#### 1. Mục đích & Yêu cầu
- Tạo service `DrinkService` quản lý dữ liệu trà sữa tập trung.
- `DrinkService` là nơi **duy nhất** trong toàn bộ dự án import file `mock-drinks.ts`.
- Tiêm (inject) `DrinkService` vào `DrinkList` để lấy dữ liệu. `DrinkList` phải **thôi import `MOCK_DRINKS`**.

#### 2. Các file cần chỉnh sửa / tạo mới
1. `src/app/drink.service.ts` *(Tạo mới)*
2. `src/app/drink-list/drink-list.ts` *(Chỉnh sửa)*

#### 3. Hướng dẫn thực hiện chi tiết

##### **Bước 1: Tạo file `src/app/drink.service.ts`**
- Sử dụng trang trí `@Injectable({ providedIn: 'root' })`.
- Giữ Signal trạng thái `private readonly drinksState = signal<DrinkModel[]>(MOCK_DRINKS);`.
- Cung cấp bản chỉ đọc ra ngoài: `readonly drinks = this.drinksState.asReadonly();`.

```typescript
// File: src/app/drink.service.ts
import { Injectable, signal } from '@angular/core';
import { DrinkModel } from './models';
import { MOCK_DRINKS } from './mock-drinks';

@Injectable({
  providedIn: 'root', // Singleton - 1 bản duy nhất cho toàn ứng dụng
})
export class DrinkService {
  // Gốc, chỉ service có quyền sửa
  private readonly drinksState = signal<DrinkModel[]>(MOCK_DRINKS);

  // Bản chỉ đọc cho bên ngoài tiêu dùng
  readonly drinks = this.drinksState.asReadonly();

  // Phương thức hỗ trợ lấy thông tin món theo id (chuẩn bị cho bài Routing)
  getDrinkById(id: number): DrinkModel | undefined {
    return this.drinksState().find((d) => d.id === id);
  }
}
```

##### **Bước 2: Cập nhật `src/app/drink-list/drink-list.ts`**
- **Xóa hẳn dòng import `MOCK_DRINKS`**.
- Tiêm `DrinkService` bằng hàm `inject(DrinkService)` ở dòng thuộc tính.
- Lấy mảng danh sách từ `this.drinkService.drinks`.

```typescript
// File: src/app/drink-list/drink-list.ts
import { Component, computed, inject, signal } from '@angular/core'; // 1. Import inject
import { FormsModule } from '@angular/forms';
import { DrinkModel } from '../models';
import { DrinkDetail } from '../drink-detail/drink-detail';
import { DrinkService } from '../drink.service'; // 2. Import DrinkService

@Component({
  selector: 'app-drink-list',
  imports: [DrinkDetail, FormsModule],
  templateUrl: './drink-list.html',
  styleUrl: './drink-list.css',
})
export class DrinkList {
  // 3. Tiêm Service vào thuộc tính
  private readonly drinkService = inject(DrinkService);

  // 4. Lấy dữ liệu danh sách từ Service thay vì MOCK_DRINKS
  protected readonly drinks = this.drinkService.drinks;
  protected readonly chonTraSua = signal<DrinkModel>(this.drinks()[0]);

  protected readonly keyword = signal<string>('');

  protected readonly filteredDrinks = computed(() => {
    const key = this.keyword().toLowerCase().trim();
    if (!key) {
      return this.drinks();
    }
    return this.drinks().filter((drink) =>
      drink.name.toLowerCase().includes(key)
    );
  });

  protected chonDrink(drink: DrinkModel): void {
    this.chonTraSua.set(drink);
  }

  protected readonly maxPrice = computed(() => {
    return Math.max(...this.drinks().map((drink) => drink.giaCoBan));
  });
}
```

> 💡 **Phép thử tự kiểm tra C14**:
> Mở terminal chạy lệnh: `grep -rn "mock-drinks" src/`
> Kết quả **chỉ được phép ra đúng 1 dòng** import nằm ở file `drink.service.ts`.

---

### 🟡 Nhiệm vụ C15 — Ôn Bài 15: Routing (Ứng Dụng Nhanh 2 Trang)

#### 1. Mục đích & Yêu cầu
- Biến ứng dụng từ 1 trang thành 2 trang có đường dẫn URL riêng biệt:
  - `/drinks`: Trang danh sách trà sữa.
  - `/drinks/:id`: Trang chi tiết trà sữa theo ID.
- Component `App` đóng vai trò khung chứa với `<router-outlet />`.
- `DrinkList` bỏ phần hiển thị chi tiết bên dưới, các nút chọn món chuyển thành thẻ `<a>` dùng `[routerLink]="['/drinks', item.id]"`.
- `DrinkDetail` gỡ cổng `input()`, tự đọc `id` từ tham số URL bằng `ActivatedRoute` và tra cứu dữ liệu từ `DrinkService`.

#### 2. Các file cần chỉnh sửa
1. `src/app/app.routes.ts`
2. `src/app/app.ts` & `src/app/app.html`
3. `src/app/drink-list/drink-list.ts` & `src/app/drink-list/drink-list.html`
4. `src/app/drink-detail/drink-detail.ts` & `src/app/drink-detail/drink-detail.html`

#### 3. Hướng dẫn thực hiện chi tiết

##### **Bước 1: Khai báo Route trong `src/app/app.routes.ts`**
```typescript
// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { DrinkList } from './drink-list/drink-list';
import { DrinkDetail } from './drink-detail/drink-detail';

export const routes: Routes = [
  { path: 'drinks', component: DrinkList },
  { path: 'drinks/:id', component: DrinkDetail },
  { path: '', redirectTo: 'drinks', pathMatch: 'full' },
];
```

##### **Bước 2: Cập nhật `App` Component (`src/app/app.ts` & `src/app/app.html`)**
- Xóa import `DrinkList`, thêm `RouterOutlet` từ `@angular/router`.

```typescript
// File: src/app/app.ts
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly tenQuan = signal('Nước mía cô 12');
}
```

```html
<!-- File: src/app/app.html -->
<h1>Hello {{ tenQuan() }}</h1>
<router-outlet />
```

##### **Bước 3: Chuyển nút bấm trong `DrinkList` thành RouterLink**
- Trong `drink-list.ts`: Import `RouterLink` từ `@angular/router`, bỏ `DrinkDetail` khỏi `imports`. Xóa signal `chonTraSua` và phương thức `chonDrink`.

```typescript
// File: src/app/drink-list/drink-list.ts
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router'; // Import RouterLink
import { DrinkService } from '../drink.service';

@Component({
  selector: 'app-drink-list',
  imports: [FormsModule, RouterLink], // Đưa RouterLink vào imports
  templateUrl: './drink-list.html',
  styleUrl: './drink-list.css',
})
export class DrinkList {
  private readonly drinkService = inject(DrinkService);
  protected readonly drinks = this.drinkService.drinks;
  protected readonly keyword = signal<string>('');

  protected readonly filteredDrinks = computed(() => {
    const key = this.keyword().toLowerCase().trim();
    if (!key) return this.drinks();
    return this.drinks().filter((drink) =>
      drink.name.toLowerCase().includes(key)
    );
  });

  protected readonly maxPrice = computed(() => {
    return Math.max(...this.drinks().map((drink) => drink.giaCoBan));
  });
}
```

- Trong `drink-list.html`: Đổi thẻ `<button>` thành thẻ `<a>`, dùng `[routerLink]="['/drinks', item.id]"`. Xóa thẻ `<app-drink-detail>`.

```html
<!-- File: src/app/drink-list/drink-list.html -->
<div class="search-box">
  <label for="search">Tìm kiếm món trà sữa:</label>
  <input
    id="search"
    type="search"
    [ngModel]="keyword()"
    (ngModelChange)="keyword.set($event)"
    placeholder="Nhập từ khóa tìm kiếm..."
  />
</div>

<hr />

<div class="drink-links">
  @for (item of filteredDrinks(); track item.id) {
    <a [routerLink]="['/drinks', item.id]" class="drink-item-link">
      {{ item.name }}
      @if (item.isPopular) {
        <span aria-label="Món phổ biến">🔥</span>
      }
      @if (item.giaCoBan === maxPrice()) {
        <span aria-label="Món đắt nhất">💎</span>
      }
    </a>
  } @empty {
    <p class="empty-message">Không tìm thấy món nào khớp với từ khóa.</p>
  }
</div>
```

##### **Bước 4: Cập nhật `DrinkDetail` đọc dữ liệu từ URL**
- Trong `drink-detail.ts`: Gỡ bỏ `input()`. Tiêm `ActivatedRoute` và `DrinkService`. Sử dụng `toSignal(this.route.paramMap)` để theo dõi sự thay đổi của tham số `:id` trên URL.

```typescript
// File: src/app/drink-detail/drink-detail.ts
import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // 1. Import ActivatedRoute & RouterLink
import { toSignal } from '@angular/core/rxjs-interop'; // 2. Import toSignal
import { DrinkService } from '../drink.service';

@Component({
  selector: 'app-drink-detail',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './drink-detail.html',
  styleUrl: './drink-detail.css',
})
export class DrinkDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly drinkService = inject(DrinkService);

  // 3. Đổi paramMap thành signal
  private readonly params = toSignal(this.route.paramMap);

  // 4. Lấy chi tiết món ăn theo id trên URL
  protected readonly selectedDrink = computed(() => {
    const id = Number(this.params()?.get('id')); // Bắt buộc bọc Number()
    return this.drinkService.getDrinkById(id);
  });

  protected readonly soLy = signal<number>(1);

  protected tangSoLy(): void {
    this.soLy.update((n) => n + 1);
  }

  protected giamSoLy(): void {
    if (this.soLy() > 1) {
      this.soLy.update((n) => n - 1);
    }
  }

  protected readonly tongTien = computed(() => {
    const drink = this.selectedDrink();
    if (!drink) return 0;
    const baseTotal = drink.giaCoBan * this.soLy();
    return this.soLy() >= 5 ? baseTotal * 0.9 : baseTotal;
  });

  protected readonly toppingCanDung = computed(() => {
    const drink = this.selectedDrink();
    if (!drink) return [];
    return drink.toppings.map((topping) => ({
      ...topping,
      quantity: topping.quantity * this.soLy(),
    }));
  });
}
```

- Trong `drink-detail.html`: Sử dụng cú pháp `@if (selectedDrink(); as drink)` để kiểm tra dữ liệu và gắn tên biến ngắn gọn `drink`. Thêm nút "Quay lại" và khối `@else` dự phòng khi nhập ID sai trên URL.

```html
<!-- File: src/app/drink-detail/drink-detail.html -->
<a routerLink="/drinks">← Quay lại danh sách</a>

@if (selectedDrink(); as drink) {
  <img [src]="drink.imgUrl" [alt]="'Ảnh ' + drink.name" width="300" />
  <div>
    <h2>{{ drink.name }}</h2>
    <p>{{ drink.description }}</p>
    <p>Giá cơ bản: {{ drink.giaCoBan | number }}đ</p>
    @if (drink.giaCoBan < 40000) {
      <span>Bình dân</span>
    } @else if (drink.giaCoBan <= 50000) {
      <span>Tiêu chuẩn</span>
    } @else {
      <span>Cao cấp</span>
    }
  </div>

  <h2>Số lượng ly</h2>
  <button type="button" [disabled]="soLy() === 1" (click)="giamSoLy()" aria-label="Giảm số ly">−</button>
  <span> {{ soLy() }} </span>
  <button type="button" (click)="tangSoLy()" aria-label="Tăng số ly">+</button>

  <p>Tổng tiền: {{ tongTien() | number }}đ</p>
  @if (soLy() >= 5) {
    <p>Đã giảm 10%</p>
  }

  <hr />
  <h3>Danh sách topping cần dùng</h3>
  <ul>
    @for (topping of toppingCanDung(); track topping.name) {
      <li [class.row-alt]="$even">
        <span>{{ $index + 1 }}. {{ topping.name }}</span>
        <strong>{{ topping.quantity }} {{ topping.unit }}</strong>
      </li>
    } @empty {
      <li>Chưa có topping nào.</li>
    }
  </ul>
} @else {
  <p>⚠️ Không tìm thấy món trà sữa này.</p>
}
```

---

### 🔴 Nhiệm vụ C16 — Ôn Bài 16: Reactive Forms (Thêm Món Trà Sữa Mới)

#### 1. Mục đích & Yêu cầu
- Tạo component `AddDrink` chứa form nhập 3 ô: Tên món (`name`), Mô tả (`description`), Giá cơ bản (`giaCoBan`).
- Tất cả các ô đều là bắt buộc (`Validators.required`).
- Khi submit form: Kiểm tra hợp lệ -> Tạo `DrinkModel` mới -> Thêm vào `DrinkService` -> Điều hướng về `/drinks`.

#### 2. Các file cần chỉnh sửa / tạo mới
1. `src/app/add-drink/add-drink.ts` *(Tạo mới)*
2. `src/app/add-drink/add-drink.html` *(Tạo mới)*
3. `src/app/add-drink/add-drink.css` *(Tạo mới)*
4. `src/app/drink.service.ts` *(Bổ sung phương thức `addDrink`)*
5. `src/app/app.routes.ts` *(Bổ sung route `drinks/new`)*

#### 3. Hướng dẫn thực hiện chi tiết

##### **Bước 1: Thêm phương thức `addDrink` vào `src/app/drink.service.ts`**
```typescript
// Trong class DrinkService (src/app/drink.service.ts)
addDrink(newDrink: DrinkModel): void {
  // Cập nhật signal tạo mảng mới (KHÔNG dùng .push())
  this.drinksState.update((current) => [...current, newDrink]);
}
```

##### **Bước 2: Tạo component `AddDrink` (`src/app/add-drink/add-drink.ts`)**
```typescript
// File: src/app/add-drink/add-drink.ts
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DrinkService } from '../drink.service';
import { DrinkModel } from '../models';

@Component({
  selector: 'app-add-drink',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './add-drink.html',
  styleUrl: './add-drink.css',
})
export class AddDrink {
  private readonly fb = inject(FormBuilder);
  private readonly drinkService = inject(DrinkService);
  private readonly router = inject(Router);

  // Tạo Form với bộ đôi nonNullable
  protected readonly drinkForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    giaCoBan: [30000, [Validators.required, Validators.min(1000)]],
  });

  protected save(): void {
    if (this.drinkForm.invalid) {
      this.drinkForm.markAllAsTouched(); // Đánh dấu lỗi hiện đỏ nếu chưa nhập
      return;
    }

    const { name, description, giaCoBan } = this.drinkForm.getRawValue();
    const currentDrinks = this.drinkService.drinks();
    const maxId = currentDrinks.length > 0 ? Math.max(...currentDrinks.map((d) => d.id)) : 0;

    const newDrink: DrinkModel = {
      id: maxId + 1,
      name,
      description,
      giaCoBan,
      imgUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
      isPopular: false,
      toppings: [],
    };

    this.drinkService.addDrink(newDrink);
    this.router.navigate(['/drinks']); // Chuyển trang về danh sách
  }
}
```

##### **Bước 3: Tạo giao diện form (`src/app/add-drink/add-drink.html`)**
```html
<!-- File: src/app/add-drink/add-drink.html -->
<a routerLink="/drinks">← Quay lại danh sách</a>
<h2>Thêm món trà sữa mới</h2>

<form [formGroup]="drinkForm" (ngSubmit)="save()">
  <div>
    <label for="name">Tên món trà sữa</label>
    <input id="name" type="text" formControlName="name" />
    @if (drinkForm.controls.name.touched && drinkForm.controls.name.invalid) {
      <span style="color: red;">Vui lòng nhập tên món.</span>
    }
  </div>

  <div>
    <label for="description">Mô tả</label>
    <input id="description" type="text" formControlName="description" />
    @if (drinkForm.controls.description.touched && drinkForm.controls.description.invalid) {
      <span style="color: red;">Vui lòng nhập mô tả.</span>
    }
  </div>

  <div>
    <label for="giaCoBan">Giá cơ bản (đ)</label>
    <input id="giaCoBan" type="number" formControlName="giaCoBan" />
  </div>

  <button type="submit">Lưu món mới</button>
</form>
```

##### **Bước 4: Cập nhật route trong `src/app/app.routes.ts`**
> ⚠️ **LƯU Ý QUAN TRỌNG VỀ THỨ TỰ ROUTE**: Route `drinks/new` **BẮT BUỘC** phải đặt TRƯỚC route `drinks/:id`. Nếu đặt sau, đường dẫn `/drinks/new` sẽ bị router hiểu nhầm là `:id = "new"`.

```typescript
// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { DrinkList } from './drink-list/drink-list';
import { DrinkDetail } from './drink-detail/drink-detail';
import { AddDrink } from './add-drink/add-drink';

export const routes: Routes = [
  { path: 'drinks', component: DrinkList },
  { path: 'drinks/new', component: AddDrink }, // ⭐ ĐẶT TRƯỚC :id
  { path: 'drinks/:id', component: DrinkDetail }, // ⭐ ĐẶT SAU new
  { path: '', redirectTo: 'drinks', pathMatch: 'full' },
];
```

##### **Bước 5: Thêm nút dẫn tới trang thêm mới ở `src/app/drink-list/drink-list.html`**
```html
<!-- Thêm liên kết ở đầu file src/app/drink-list/drink-list.html -->
<a routerLink="/drinks/new" class="btn-add">+ Thêm món trà sữa mới</a>
```

---

### 🎨 Nhiệm vụ C-CSS — Ôn Bài 10: Tổng Kết Trang Trí CSS

#### 1. Khai báo biến màu toàn cục (`src/styles.css`)
```css
/* File: src/styles.css */
:root {
  /* Bảng màu "Bếp ấm" chuẩn WCAG AA */
  --kem-nhat: #fffdf7;
  --kem: #fdf6e9;
  --kem-dam: #f0e2c8;

  --cam-nhat: #fbe3d6;
  --cam: #d2683a;
  --cam-dam: #b8512a;
  --cam-tham: #93401f;

  --xanh-nhat: #e3f0e0;
  --xanh-dam: #38603b;

  --chu-chinh: #3a332c;
  --chu-nhat: #6b6259;
}

body {
  margin: 0;
  background-color: var(--kem);
  color: var(--chu-chinh);
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}
```

#### 2. Giới hạn khung hình ứng dụng (`src/app/app.css`)
```css
/* File: src/app/app.css */
:host {
  display: block;
  max-width: 680px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}
```

---

## PHẦN D — THỬ THÁCH NÂNG CAO (NÂNG CAO & MỞ RỘNG)

---

### 🔹 D1: Tìm Kiếm Theo Nhiều Trường (`name` và `description`)
- **Vị trí**: `src/app/drink-list/drink-list.ts`
- **Cách thực hiện**: Cập nhật hàm `filter` trong `filteredDrinks` computed kiểm tra cả tên và mô tả:

```typescript
protected readonly filteredDrinks = computed(() => {
  const key = this.keyword().toLowerCase().trim();
  if (!key) return this.drinks();
  return this.drinks().filter(
    (drink) =>
      drink.name.toLowerCase().includes(key) ||
      drink.description.toLowerCase().includes(key)
  );
});
```

---

### 🔹 D2: Sắp Xếp Theo Giá (Giá Tăng Dần / Giá Giảm Dần)
- **Vị trí**: `src/app/drink-list/drink-list.ts` & `src/app/drink-list/drink-list.html`
- **Cách thực hiện**: Tạo signal `sortOrder` và sử dụng `.sort()` kết hợp toán tử spread `[...]` (để tránh làm biến đổi trực tiếp mảng gốc).

```typescript
// Trong src/app/drink-list/drink-list.ts
protected readonly sortOrder = signal<'asc' | 'desc' | 'default'>('default');

protected readonly filteredDrinks = computed(() => {
  const key = this.keyword().toLowerCase().trim();
  let result = this.drinks();

  if (key) {
    result = result.filter(
      (drink) =>
        drink.name.toLowerCase().includes(key) ||
        drink.description.toLowerCase().includes(key)
    );
  }

  // Sắp xếp trên bản sao mảng
  if (this.sortOrder() === 'asc') {
    result = [...result].sort((a, b) => a.giaCoBan - b.giaCoBan);
  } else if (this.sortOrder() === 'desc') {
    result = [...result].sort((a, b) => b.giaCoBan - a.giaCoBan);
  }

  return result;
});

protected setSort(order: 'asc' | 'desc' | 'default'): void {
  this.sortOrder.set(order);
}
```

```html
<!-- Trong src/app/drink-list/drink-list.html -->
<div class="sort-buttons">
  <button type="button" (click)="setSort('asc')">Giá tăng dần</button>
  <button type="button" (click)="setSort('desc')">Giá giảm dần</button>
  <button type="button" (click)="setSort('default')">Đặt lại</button>
</div>
```

---

### 🔹 D3: Đếm Kết Quả Tìm Kiếm ("Tìm thấy N món")
- **Vị trí**: `src/app/drink-list/drink-list.html`
- **Cách thực hiện**: Lấy thuộc tính `.length` trực tiếp từ signal `filteredDrinks()`:

```html
<p class="count-text">Tìm thấy {{ filteredDrinks().length }} món trà sữa</p>
```

---

### 🔹 D4: Xóa Món Trà Sữa (`deleteDrink`)
- **Vị trí**: `src/app/drink.service.ts` & `src/app/drink-detail/drink-detail.ts`
- **Cách thực hiện**:
  1. Trong Service: Thêm hàm dùng `.filter()` để loại bỏ item.
  2. Trong Component chi tiết: Thêm nút xóa, khi xóa xong tự chuyển hướng về `/drinks`.

```typescript
// 1. Trong src/app/drink.service.ts
deleteDrink(id: number): void {
  this.drinksState.update((current) => current.filter((d) => d.id !== id));
}
```

```typescript
// 2. Trong src/app/drink-detail/drink-detail.ts
private readonly router = inject(Router);

protected deleteDrink(id: number): void {
  if (confirm('Bạn có chắc chắn muốn xóa món này?')) {
    this.drinkService.deleteDrink(id);
    this.router.navigate(['/drinks']);
  }
}
```

```html
<!-- Trong src/app/drink-detail/drink-detail.html -->
<button type="button" (click)="deleteDrink(drink.id)">🗑️ Xóa món này</button>
```

---

### 🔹 D5: Đảo Trạng Thái Yêu Thích / Phổ Biến (`toggleFavorite`)
- **Vị trí**: `src/app/drink.service.ts` & `src/app/drink-detail/drink-detail.ts`
- **Cách thực hiện**: Thêm hàm dùng `.map()` để đảo giá trị `isPopular`.

```typescript
// 1. Trong src/app/drink.service.ts
toggleFavorite(id: number): void {
  this.drinksState.update((current) =>
    current.map((d) => (d.id === id ? { ...d, isPopular: !d.isPopular } : d))
  );
}
```

```typescript
// 2. Trong src/app/drink-detail/drink-detail.ts
protected toggleFavorite(id: number): void {
  this.drinkService.toggleFavorite(id);
}
```

```html
<!-- Trong src/app/drink-detail/drink-detail.html -->
<button type="button" (click)="toggleFavorite(drink.id)">
  {{ drink.isPopular ? 'Bỏ yêu thích 🔥' : 'Thêm yêu thích ❤️' }}
</button>
```

---

### 🔹 D6: Route Bắt Lỗi 404 (`NotFound`)
- **Vị trí**: `src/app/app.routes.ts` & `src/app/not-found/not-found.ts`
- **Cách thực hiện**: Tạo component `NotFound` và khai báo path `'**'` ở **CUỐI CÙNG** mảng `routes`.

```typescript
// File: src/app/not-found/not-found.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <h2>404 - Trang không tồn tại</h2>
    <p>Rất tiếc, đường dẫn bạn truy cập không hợp lệ.</p>
    <a routerLink="/drinks">Quay về trang danh sách</a>
  `,
})
export class NotFound {}
```

```typescript
// File: src/app/app.routes.ts
import { Routes } from '@angular/router';
import { DrinkList } from './drink-list/drink-list';
import { DrinkDetail } from './drink-detail/drink-detail';
import { AddDrink } from './add-drink/add-drink';
import { NotFound } from './not-found/not-found';

export const routes: Routes = [
  { path: 'drinks', component: DrinkList },
  { path: 'drinks/new', component: AddDrink },
  { path: 'drinks/:id', component: DrinkDetail },
  { path: '', redirectTo: 'drinks', pathMatch: 'full' },
  { path: '**', component: NotFound }, // ⭐ BẮT BUỘC ĐẶT Ở CUỐI CÙNG
];
```

> ⚠️ **Lý do wildcard `**` phải đặt ở cuối cùng**: Router Angular duyệt mảng `routes` từ trên xuống dưới theo nguyên tắc **khớp đầu tiên (first match)**. Nếu đặt `**` ở đầu, mọi đường dẫn sẽ bị khớp ngay lập tức với `NotFound` và ứng dụng không bao giờ truy cập được các trang khác.

---

## BẢNG TỔNG HỢP KIỂM TRA TIẾN ĐỘ

| Mã | Nội dung nhiệm vụ | Đã xong? |
|---|---|:---:|
| **C13** | Two-way binding ô tìm kiếm + `computed` lọc danh sách | ⬜ |
| **C14** | `DrinkService` + `inject()` ngắt phụ thuộc trực tiếp vào mock | ⬜ |
| **C15** | Routing 2 trang + `ActivatedRoute` đọc `:id` | ⬜ |
| **C16** | Reactive Forms thêm món + `FormBuilder` + `Validators` | ⬜ |
| **C-CSS**| Cấu trúc khung giao diện + bảng màu "Bếp ấm" | ⬜ |
| **D1** | Lọc tìm kiếm trên cả tên và mô tả | ⬜ |
| **D2** | Sắp xếp danh sách theo giá (Tăng/Giảm) | ⬜ |
| **D3** | Đếm và hiển thị số lượng kết quả tìm thấy | ⬜ |
| **D4** | Xóa món khỏi danh sách với `.filter()` | ⬜ |
| **D5** | Đảo trạng thái yêu thích với `.map()` | ⬜ |
| **D6** | Trang 404 Not Found với wildcard route `**` | ⬜ |
