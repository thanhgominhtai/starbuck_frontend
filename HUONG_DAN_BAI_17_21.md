# HƯỚNG DẪN THỰC HÀNH CHI TIẾT (PHẦN C & PHẦN D)
> **Phạm vi tập trung**: **Phần C (Project Quầy Trà Sữa C17 → C21 & M3-1 → M3-7)** và **Phần D (Thử thách nâng cao D1 → D6)**.  
> **Mục đích**: Hướng dẫn step-by-step chỉ riêng phần THỰC HÀNH CODE, trình bày rõ từng file cần sửa, code mẫu chuẩn và giải thích chi tiết để bạn tự nhìn vào gõ code thực hành.

---

## 📋 MỤC LỤC PHẦN THỰC HÀNH

1. [⚙️ CHUẨN BỊ BAN ĐẦU (Cài đặt & Cấu hình)](#️-chuẩn-bị-ban-đầu-cài-đặt--cấu-hình)
2. [🧋 PHẦN C — PROJECT QUẦY TRÀ SỮA](#-phần-c--project-quầy-trà-sữa)
   - [Bước C17 — Nâng cấp giao diện Angular Material](#bước-c17--nâng-cấp-giao-diện-angular-material)
   - [Bước C18 — Chuyển sang Signal Forms (`@angular/forms/signals`)](#bước-c18--chuyển-sang-signal-forms-angularformssignals)
   - [Bước C19 — Xử lý Gửi và Reset Form 2 bước](#bước-c19--xử-lý-gửi-và-reset-form-2-bước)
   - [Bước C20 — Thêm các luật Kiểm tra hợp lệ (Validation)](#bước-c20--thêm-các-luật-kiểm-tra-hợp-lệ-validation)
   - [Bước C21 — Hiển thị Thông báo lỗi `<mat-error>` & Gợi ý `<mat-hint>`](#bước-c21--hiển-thị-thông-báo-lỗi-mat-error--gợi-ý-mat-hint)
   - [Bước C-M3 — Chuẩn hóa Material Design 3 kiểu Google (M3-1 → M3-7)](#bước-c-m3--chuẩn-hóa-material-design-3-kiểu-google-m3-1--m3-7)
3. [🚀 PHẦN D — THỬ THÁCH NÂNG CAO (D1 → D6)](#-phần-d--thử-thách-nâng-cao-d1--d6)
   - [D1. Responsive Drawer (`BreakpointObserver`)](#d1-responsive-drawer-breakpointobserver)
   - [D2. Chip lọc theo trạng thái (`MatChipsModule`)](#d2-chip-lọc-theo-trạng-thái-matchipsmodule)
   - [D3. Thông báo Toast thành công (`MatSnackBar`)](#d3-thông-báo-toast-thành-công-matsnackbar)
   - [D4. Hộp thoại xác nhận xóa món (`MatDialog`)](#d4-hộp-thoại-xác-nhận-xóa-món-matdialog)
   - [D5. Trạng thái Loading / Spinner (`MatProgressSpinnerModule`)](#d5-trạng-thái-loading--spinner-matprogressspinnermodule)
   - [D6. Sắp xếp và Lọc kết hợp (`MatSelect` + `computed`)](#d6-sắp-xếp-và-lọc-kết-hợp-matselect--computed)

---

## ⚙️ CHUẨN BỊ BAN ĐẦU (Cài đặt & Cấu hình)

### 1. Cài đặt Angular Material v21
Mở Terminal trong thư mục project `btvnAngu` và chạy lệnh:
```bash
npm install @angular/material@^21.2.0 @angular/cdk@^21.2.0
```

### 2. Cấu hình Font Roboto & Icons trong `src/index.html`
Mở `src/index.html` và thêm các thẻ `<link>` sau vào trong `<head>`:
```html
<!-- File: src/index.html -->
<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Symbols+Outlined" rel="stylesheet">
```

### 3. Cấu hình `src/app/app.config.ts`
Thêm Provider Animation bất đồng bộ và thiết lập font icon mặc định:
```typescript
// File: src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } }
  ]
};
```

---

## 🧋 PHẦN C — PROJECT QUẦY TRÀ SỮA

---

### Bước C17 — Nâng cấp giao diện Angular Material

#### 1. Cập nhật Model & Mock Data (Thêm trường `authorEmail`)
- **Sửa `src/app/models.ts`**: Thêm `authorEmail: string;` vào interface `DrinkModel`:
  ```typescript
  // File: src/app/models.ts
  export interface DrinkModel {
    id: number;
    name: string;
    description: string;
    giaCoBan: number;
    imgUrl: string;
    isPopular: boolean;
    authorEmail: string; // 👈 Thêm dòng này
    toppings: Topping[];
  }
  ```
- **Sửa `src/app/mock-drinks.ts`**: Bổ sung email cho 3 món mẫu:
  ```typescript
  // File: src/app/mock-drinks.ts
  export const MOCK_DRINKS: DrinkModel[] = [
    { id: 1, name: "Trà sữa trân châu đường đen", description: "thom ngon dam vi tra sua", giaCoBan: 30000, imgUrl: "...", isPopular: true, authorEmail: "admin@trasua.com", toppings: [...] },
    { id: 2, name: "Trà sữa Matcha", description: "Nước mía nguyên chất", giaCoBan: 40000, imgUrl: "...", isPopular: true, authorEmail: "barista@trasua.com", toppings: [...] },
    { id: 3, name: "Hồng trà sữa", description: "Nước mía nguyên chất", giaCoBan: 50000, imgUrl: "...", isPopular: false, authorEmail: "manager@trasua.com", toppings: [...] }
  ];
  ```

#### 2. Nâng cấp Toolbar & App Layout (`app.ts` & `app.html`)
Chuyển thẻ `<h1>` trong `app.html` thành thanh tiêu đề `<mat-toolbar>`:
```typescript
// File: src/app/app.ts
import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatIconModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
```

#### 3. Nâng cấp Ô tìm kiếm & Danh sách món (`drink-list`)
Chuyển `<input>` tìm kiếm sang `<mat-form-field>` + `matInput`:
```typescript
// File: src/app/drink-list/drink-list.ts
import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-drink-list',
  imports: [
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
  ],
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
    return this.drinks().filter((d) =>
      d.name.toLowerCase().includes(key) || d.description.toLowerCase().includes(key)
    );
  });
}
```

```html
<!-- File: src/app/drink-list/drink-list.html -->
<div class="search-box">
  <mat-form-field appearance="outline" class="full-width">
    <mat-label>Tìm kiếm món trà sữa</mat-label>
    <input
      matInput
      type="text"
      [ngModel]="keyword()"
      (ngModelChange)="keyword.set($event)"
      placeholder="Nhập từ khóa..."
    />
    <mat-icon matSuffix>search</mat-icon>
  </mat-form-field>
</div>

<mat-nav-list>
  @for (drink of filteredDrinks(); track drink.id) {
    <a mat-list-item [routerLink]="['/drinks', drink.id]">
      <mat-icon matListItemIcon>local_cafe</mat-icon>
      <span matListItemTitle>{{ drink.name }}</span>
      <span matListItemLine>{{ drink.description }}</span>
      <span matListItemMeta>{{ drink.giaCoBan }}đ</span>
    </a>
  } @empty {
    <mat-list-item>Không tìm thấy món trà nào!</mat-list-item>
  }
</mat-nav-list>
```

---

### Bước C18 — Chuyển sang Signal Forms (`@angular/forms/signals`)

Thay thế `FormBuilder` / `ReactiveFormsModule` bằng `form()` và `FormField`.

#### Sửa `src/app/add-drink/add-drink.ts`
```typescript
// File: src/app/add-drink/add-drink.ts
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { form, FormField } from '@angular/forms/signals'; // ⚠️ Nhớ import từ '/signals'

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { DrinkService } from '../drink-service';

@Component({
  selector: 'app-add-drink',
  imports: [
    RouterLink,
    FormField, // Directive FormField của Signal Forms
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './add-drink.html',
  styleUrl: './add-drink.css',
})
export class AddDrink {
  private readonly drinkService = inject(DrinkService);

  // 1. Model dữ liệu gốc là 1 signal thường (4 trường)
  protected readonly drinkModel = signal({
    name: '',
    description: '',
    giaCoBan: 0, // ⚠️ Kiểu số, khởi tạo bằng 0
    authorEmail: '',
  });

  // 2. Form bọc QUANH signal - không giữ bản sao
  protected readonly drinkForm = form(this.drinkModel);
}
```

---

### Bước C19 — Xử lý Gửi và Reset Form 2 bước

Sử dụng hàm `submit()` bất đồng bộ và reset form đúng 2 bước khi gửi thành công.

#### 1. Sửa `src/app/add-drink/add-drink.ts` (Viết hàm save)
```typescript
// File: src/app/add-drink/add-drink.ts (Bổ sung C19)
import { submit } from '@angular/forms/signals';

export class AddDrink {
  // ... (khai báo model & form ở C18)

  protected async save(event: Event): Promise<void> {
    event.preventDefault(); // Tự chặn hành vi mặc định của trình duyệt

    const ok = await submit(this.drinkForm, async () => {
      const current = this.drinkModel();
      this.drinkService.addDrink({
        id: Date.now(),
        name: current.name,
        description: current.description,
        giaCoBan: current.giaCoBan,
        authorEmail: current.authorEmail,
        imgUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?w=600',
        isPopular: false,
        toppings: [],
      });
    });

    if (ok) {
      // ⚠️ RESET 2 BƯỚC BẮT BUỘC:
      this.drinkForm().reset(); // 1. Xóa trạng thái touched / dirty của form
      this.drinkModel.set({ name: '', description: '', giaCoBan: 0, authorEmail: '' }); // 2. Xóa DỮ LIỆU
    }
  }
}
```

#### 2. Sửa `src/app/add-drink/add-drink.html`
```html
<!-- File: src/app/add-drink/add-drink.html -->
<a routerLink="/drinks">← Quay lại danh sách</a>
<h2>Thêm món trà sữa mới</h2>

<!-- Thẻ form novalidate (submit)="save($event)", KHÔNG dùng [formRoot] -->
<form novalidate (submit)="save($event)">
  <mat-form-field appearance="outline">
    <mat-label>Tên món trà</mat-label>
    <input matInput type="text" [formField]="drinkForm.name" />
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Mô tả món</mat-label>
    <input matInput type="text" [formField]="drinkForm.description" />
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Giá cơ bản (đ)</mat-label>
    <input matInput type="number" [formField]="drinkForm.giaCoBan" />
  </mat-form-field>

  <mat-form-field appearance="outline">
    <mat-label>Email người tạo</mat-label>
    <input matInput type="email" [formField]="drinkForm.authorEmail" />
  </mat-form-field>

  <!-- Nút submit tự khóa khi đang gửi -->
  <button
    type="submit"
    matButton="filled"
    [disabled]="drinkForm().submitting()"
  >
    Lưu món mới
  </button>
</form>
```

---

### Bước C20 — Thêm các luật Kiểm tra hợp lệ (Validation)

Khai báo các luật kiểm tra bằng tiếng Việt trực tiếp trong hàm `form()`:

```typescript
// File: src/app/add-drink/add-drink.ts (Bổ sung C20)
import {
  form,
  submit,
  FormField,
  required,
  email,
  min,
  max,
  minLength,
} from '@angular/forms/signals';

export class AddDrink {
  protected readonly drinkModel = signal({
    name: '',
    description: '',
    giaCoBan: 0,
    authorEmail: '',
  });

  protected readonly drinkForm = form(this.drinkModel, (path) => {
    required(path.name, { message: 'Tên món trà là bắt buộc.' });
    minLength(path.name, 3, { message: 'Tên món phải có tối thiểu 3 ký tự.' });

    required(path.description, { message: 'Mô tả món là bắt buộc.' });

    required(path.giaCoBan, { message: 'Giá bán là bắt buộc.' });
    min(path.giaCoBan, 1000, { message: 'Giá tối thiểu là 1.000đ.' });
    max(path.giaCoBan, 200000, { message: 'Giá tối đa là 200.000đ.' });

    required(path.authorEmail, { message: 'Email người tạo là bắt buộc.' });
    email(path.authorEmail, { message: 'Email không đúng định dạng.' });
  });
}
```

---

### Bước C21 — Hiển thị Thông báo lỗi `<mat-error>` & Gợi ý `<mat-hint>`

Hiển thị danh sách lỗi thông qua vòng lặp `@for` duyệt `errors()` và thêm `<mat-hint>` cho ô email:

```html
<!-- File: src/app/add-drink/add-drink.html (Cập nhật C21) -->
<form novalidate (submit)="save($event)">
  <!-- Ô Tên món -->
  <mat-form-field appearance="outline">
    <mat-label>Tên món trà</mat-label>
    <input matInput type="text" [formField]="drinkForm.name" />
    @for (err of drinkForm.name().errors(); track err.kind) {
      <mat-error>{{ err.message }}</mat-error>
    }
  </mat-form-field>

  <!-- Ô Mô tả -->
  <mat-form-field appearance="outline">
    <mat-label>Mô tả chi tiết</mat-label>
    <input matInput type="text" [formField]="drinkForm.description" />
    @for (err of drinkForm.description().errors(); track err.kind) {
      <mat-error>{{ err.message }}</mat-error>
    }
  </mat-form-field>

  <!-- Ô Giá cơ bản -->
  <mat-form-field appearance="outline">
    <mat-label>Giá cơ bản (đ)</mat-label>
    <input matInput type="number" [formField]="drinkForm.giaCoBan" />
    @for (err of drinkForm.giaCoBan().errors(); track err.kind) {
      <mat-error>{{ err.message }}</mat-error>
    }
  </mat-form-field>

  <!-- Ô Email người tạo + mat-hint -->
  <mat-form-field appearance="outline">
    <mat-label>Email người tạo</mat-label>
    <input matInput type="email" [formField]="drinkForm.authorEmail" />
    <mat-hint>Ví dụ: admin@trasua.com</mat-hint>
    @for (err of drinkForm.authorEmail().errors(); track err.kind) {
      <mat-error>{{ err.message }}</mat-error>
    }
  </mat-form-field>

  <button type="submit" matButton="filled" [disabled]="drinkForm().submitting()">
    Lưu món mới
  </button>
</form>
```

---

### Bước C-M3 — Chuẩn hóa Material Design 3 kiểu Google (M3-1 → M3-7)

#### M3-1: Bố cục chuẩn Web App Google (`app.ts`, `app.html`, `app.css`)
- **`src/app/app.ts`**:
  ```typescript
  import { Component } from '@angular/core';
  import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
  import { MatToolbarModule } from '@angular/material/toolbar';
  import { MatSidenavModule } from '@angular/material/sidenav';
  import { MatListModule } from '@angular/material/list';
  import { MatIconModule } from '@angular/material/icon';
  import { MatButtonModule } from '@angular/material/button';

  @Component({
    selector: 'app-root',
    imports: [
      RouterOutlet,
      RouterLink,
      RouterLinkActive,
      MatToolbarModule,
      MatSidenavModule,
      MatListModule,
      MatIconModule,
      MatButtonModule,
    ],
    templateUrl: './app.html',
    styleUrl: './app.css'
  })
  export class App {}
  ```
- **`src/app/app.html`**:
  ```html
  <mat-sidenav-container class="app-sidenav-container">
    <mat-sidenav #drawer mode="side" opened class="app-sidenav">
      <mat-nav-list>
        <a mat-list-item routerLink="/drinks" routerLinkActive="active-link">
          <mat-icon matListItemIcon>local_cafe</mat-icon>
          <span matListItemTitle>Menu Món Trà</span>
        </a>
        <a mat-list-item routerLink="/drinks/new" routerLinkActive="active-link">
          <mat-icon matListItemIcon>add_circle</mat-icon>
          <span matListItemTitle>Thêm món mới</span>
        </a>
      </mat-nav-list>
    </mat-sidenav>

    <mat-sidenav-content>
      <mat-toolbar class="app-toolbar">
        <button mat-icon-button (click)="drawer.toggle()" aria-label="Mở menu">
          <mat-icon>menu</mat-icon>
        </button>
        <span>Quầy Trà Sữa</span>
      </mat-toolbar>

      <main class="main-content p-24">
        <router-outlet></router-outlet>
      </main>

      <!-- M3-2: Nút Nổi FAB -->
      <a mat-fab class="app-fab" routerLink="/drinks/new" aria-label="Thêm món">
        <mat-icon>add</mat-icon>
      </a>
    </mat-sidenav-content>
  </mat-sidenav-container>
  ```

#### M3-3: Danh sách món dạng Card Grid M3 (`drink-list.html` & `drink-list.css`)
- **`src/app/drink-list/drink-list.html`**:
  ```html
  <div class="card-grid">
    @for (drink of filteredDrinks(); track drink.id) {
      <mat-card class="drink-card" [routerLink]="['/drinks', drink.id]">
        <img mat-card-image [src]="drink.imgUrl" [alt]="drink.name" class="card-img" />
        <mat-card-header>
          <mat-card-title>{{ drink.name }}</mat-card-title>
          <mat-card-subtitle>{{ drink.description }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content class="p-16">
          <span class="price-text">{{ drink.giaCoBan }}đ</span>
        </mat-card-content>
        <mat-card-actions align="end">
          <a mat-button color="primary" [routerLink]="['/drinks', drink.id]">Chi tiết</a>
        </mat-card-actions>
      </mat-card>
    }
  </div>
  ```

#### M3-4 → M3-7: Sử dụng 100% Token M3 trong `src/styles.css`
```css
/* File: src/styles.css */
:root {
  color-scheme: light dark; /* M3-7: Chế độ Tối hoạt động tự động */
}

html, body {
  height: 100%;
  margin: 0;
  font-family: Roboto, sans-serif;
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}

.p-8 { padding: 8px; }
.p-16 { padding: 16px; }
.p-24 { padding: 24px; }
```

---

## 🚀 PHẦN D — THỬ THÁCH NÂNG CAO (D1 → D6)

---

### D1. Responsive Drawer (`BreakpointObserver`)

Lắng nghe kích thước màn hình để tự động điều chỉnh mode của Drawer:
- Màn hình rộng (>768px): `mode="side"` + `opened=true`.
- Màn hình nhỏ (Mobile): `mode="over"` + `opened=false`.

#### Sửa `src/app/app.ts`
```typescript
// File: src/app/app.ts (Bổ sung D1)
import { Component, inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

export class App {
  private readonly breakpointObserver = inject(BreakpointObserver);
  protected readonly isHandset = signal(false);

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.Handset, '(max-width: 768px)'])
      .subscribe((result) => {
        this.isHandset.set(result.matches);
      });
  }
}
```

#### Sửa `src/app/app.html`
```html
<!-- File: src/app/app.html (Bổ sung D1) -->
<mat-sidenav
  #drawer
  [mode]="isHandset() ? 'over' : 'side'"
  [opened]="!isHandset()"
  class="app-sidenav"
>
```

---

### D2. Chip lọc theo trạng thái (`MatChipsModule`)

Thêm hàng chip lựa chọn "Tất cả món" / "⭐ Phổ biến" phía trên danh sách.

#### 1. Sửa `src/app/drink-list/drink-list.ts`
```typescript
// File: src/app/drink-list/drink-list.ts (Bổ sung D2)
import { MatChipsModule } from '@angular/material/chips';

@Component({
  imports: [ /* ... */ MatChipsModule ],
})
export class DrinkList {
  protected readonly categoryFilter = signal<'all' | 'popular'>('all');

  protected onCategoryChange(category: 'all' | 'popular'): void {
    this.categoryFilter.set(category);
  }
}
```

#### 2. Sửa `src/app/drink-list/drink-list.html`
```html
<!-- File: src/app/drink-list/drink-list.html (Bổ sung D2) -->
<div class="chips-container p-8">
  <mat-chip-set aria-label="Bộ lọc loại món">
    <mat-chip-option
      [selected]="categoryFilter() === 'all'"
      (click)="onCategoryChange('all')"
    >
      Tất cả món
    </mat-chip-option>
    <mat-chip-option
      [selected]="categoryFilter() === 'popular'"
      (click)="onCategoryChange('popular')"
    >
      ⭐ Phổ biến
    </mat-chip-option>
  </mat-chip-set>
</div>
```

---

### D3. Thông báo Toast thành công (`MatSnackBar`)

Hiển thị thanh thông báo "Đã thêm món mới thành công!" ở góc màn hình sau khi lưu form.

#### Sửa `src/app/add-drink/add-drink.ts`
```typescript
// File: src/app/add-drink/add-drink.ts (Bổ sung D3)
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  imports: [ /* ... */ MatSnackBarModule ],
})
export class AddDrink {
  private readonly snackBar = inject(MatSnackBar);

  protected async save(event: Event): Promise<void> {
    event.preventDefault();

    const ok = await submit(this.drinkForm, async () => {
      // ... thêm món
    });

    if (ok) {
      // Bật Toast thông báo (D3)
      this.snackBar.open('Đã thêm món mới thành công!', 'Đóng', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom',
      });

      this.drinkForm().reset();
      this.drinkModel.set({ name: '', description: '', giaCoBan: 0, authorEmail: '' });
    }
  }
}
```

---

### D4. Hộp thoại xác nhận xóa món (`MatDialog`)

Hiển thị hộp thoại hỏi lại người dùng trước khi thực sự xóa món khỏi danh sách.

#### 1. Tạo component `src/app/drink-detail/confirm-dialog.component.ts`
```typescript
// File: src/app/drink-detail/confirm-dialog.component.ts (Tạo mới D4)
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Xác nhận xóa</h2>
    <mat-dialog-content>
      Bạn có chắc chắn muốn xóa món <strong>"{{ data.drinkName }}"</strong> này không?
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy bỏ</button>
      <button mat-filled-button color="warn" (click)="onConfirm()">Xóa món</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  protected readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  protected readonly data = inject<{ drinkName: string }>(MAT_DIALOG_DATA);

  onCancel(): void { this.dialogRef.close(false); }
  onConfirm(): void { this.dialogRef.close(true); }
}
```

#### 2. Gọi Dialog từ `src/app/drink-detail/drink-detail.ts`
```typescript
// File: src/app/drink-detail/drink-detail.ts (Bổ sung D4)
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Component({
  imports: [ /* ... */ MatDialogModule ],
})
export class DrinkDetail {
  private readonly dialog = inject(MatDialog);

  protected confirmDelete(): void {
    const d = this.drink();
    if (!d) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: { drinkName: d.name },
    });

    ref.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.drinkService.deleteDrink(d.id);
        this.router.navigate(['/drinks']);
      }
    });
  }
}
```

---

### D5. Trạng thái Loading / Spinner (`MatProgressSpinnerModule`)

Hiển thị vòng xoay spinner trên nút Lưu khi form đang xử lý submit.

#### Sửa `src/app/add-drink/add-drink.html`
```html
<!-- File: src/app/add-drink/add-drink.html (Bổ sung D5) -->
<button
  type="submit"
  matButton="filled"
  [disabled]="drinkForm().submitting()"
>
  @if (drinkForm().submitting()) {
    <mat-spinner diameter="20"></mat-spinner>
    <span>Đang lưu...</span>
  } @else {
    <span>Lưu món</span>
  }
</button>
```

---

### D6. Sắp xếp và Lọc kết hợp (`MatSelect` + `computed`)

Kết hợp ô Tìm kiếm + Chip Phân loại + Menu Sắp xếp (`MatSelect`) trong 1 `computed` duy nhất.

#### 1. Sửa `src/app/drink-list/drink-list.ts`
```typescript
// File: src/app/drink-list/drink-list.ts (Bổ sung D6)
import { MatSelectModule } from '@angular/material/select';

@Component({
  imports: [ /* ... */ MatSelectModule ],
})
export class DrinkList {
  protected readonly sortOption = signal<'default' | 'price-asc' | 'price-desc' | 'name-asc'>('default');

  protected readonly filteredDrinks = computed(() => {
    const key = this.keyword().toLowerCase().trim();
    const category = this.categoryFilter();
    const sort = this.sortOption();

    let result = [...this.drinks()];

    // 1. Tìm kiếm theo từ khóa
    if (key) {
      result = result.filter(
        (d) => d.name.toLowerCase().includes(key) || d.description.toLowerCase().includes(key)
      );
    }

    // 2. Lọc theo Chip loại (D2)
    if (category === 'popular') {
      result = result.filter((d) => d.isPopular);
    }

    // 3. Sắp xếp (D6)
    if (sort === 'price-asc') {
      result.sort((a, b) => a.giaCoBan - b.giaCoBan);
    } else if (sort === 'price-desc') {
      result.sort((a, b) => b.giaCoBan - a.giaCoBan);
    } else if (sort === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  });
}
```

#### 2. Sửa `src/app/drink-list/drink-list.html`
```html
<!-- File: src/app/drink-list/drink-list.html (Bổ sung D6) -->
<mat-form-field appearance="outline" class="sort-field">
  <mat-label>Sắp xếp theo</mat-label>
  <mat-select
    [ngModel]="sortOption()"
    (ngModelChange)="sortOption.set($event)"
  >
    <mat-option value="default">Mặc định</mat-option>
    <mat-option value="price-asc">Giá tăng dần</mat-option>
    <mat-option value="price-desc">Giá giảm dần</mat-option>
    <mat-option value="name-asc">Tên A-Z</mat-option>
  </mat-select>
</mat-form-field>
```
