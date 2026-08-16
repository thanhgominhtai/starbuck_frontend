import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RecipeService } from '../../../core/services/recipe.service';
import { UploadService } from '../../../core/services/upload.service';
import { ToastService } from '../../../core/services/toast.service';
import { Recipe } from '../../../core/models/recipe.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { VndCurrencyPipe } from '../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-admin-recipe-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, ConfirmDialogComponent, VndCurrencyPipe],
  template: `
    <div class="recipe-mgr-view">
      <!-- Header [AD-08, AD-09] -->
      <div class="mgr-header">
        <div>
          <h1 class="mgr-title">Quản Trị Thực Đơn & Công Thức</h1>
          <p class="mgr-desc">Tạo mới, chỉnh sửa, tải ảnh và quản lý nguyên liệu công thức riêng biệt của Admin</p>
        </div>

        <button class="btn-create-recipe" (click)="openCreateModal()">
          <mat-icon>add_circle</mat-icon>
          Thêm Món Mới
        </button>
      </div>

      <!-- Search & Category Filters [FE-07] -->
      <div class="filter-row">
        <div class="search-input-box">
          <mat-icon>search</mat-icon>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Tìm kiếm món ăn trong kho quản trị..."
            (keyup.enter)="fetchRecipes()"
          />
        </div>
      </div>

      <!-- Recipe Data Table -->
      <div class="table-card">
        <table class="sb-table" *ngIf="!loading() && recipes().length > 0">
          <thead>
            <tr>
              <th>ẢNH</th>
              <th>TÊN CÔNG THỨC</th>
              <th>DANH MỤC</th>
              <th>GIÁ CƠ BẢN</th>
              <th>TOPPINGS</th>
              <th>NỔI BẬT</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of recipes()">
              <td>
                <img [src]="r.imgUrl" [alt]="r.name" class="recipe-thumb" />
              </td>
              <td>
                <div class="r-info-cell">
                  <strong class="r-title">{{ r.name }}</strong>
                  <span class="r-desc">{{ r.description }}</span>
                </div>
              </td>
              <td>
                <span class="cat-tag">{{ r.category || 'Món' }}</span>
              </td>
              <td>
                <span class="price-tag">{{ r.giaCoBan | vndCurrency }}</span>
              </td>
              <td>
                <span class="topping-badge">{{ r.toppings ? r.toppings.length : 0 }} nguyên liệu</span>
              </td>
              <td>
                <span class="popular-indicator" [class.is-pop]="r.isPopular">
                  {{ r.isPopular ? '★ Bán chạy' : 'Bình thường' }}
                </span>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon-edit" (click)="openEditModal(r)" title="Chỉnh sửa">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="btn-icon-del" (click)="openDeleteConfirm(r)" title="Xoá món">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="loading()" class="table-loading">Đang tải danh sách công thức...</div>
        <div *ngIf="!loading() && recipes().length === 0" class="table-empty">
          <mat-icon>menu_book</mat-icon>
          <p>Chưa có món ăn nào trong kho thực đơn.</p>
        </div>
      </div>

      <!-- CREATE / EDIT MODAL [AD-08, FE-12] -->
      <div class="modal-backdrop" *ngIf="modalOpen()">
        <div class="modal-panel">
          <div class="modal-header">
            <h3>{{ isEditMode() ? 'Chỉnh sửa món ăn' : 'Thêm công thức món mới' }}</h3>
            <button class="btn-close" (click)="modalOpen.set(false)">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="recipeForm" (ngSubmit)="onSaveRecipe()" class="recipe-form">
            <div class="form-row">
              <label>Tên món / công thức:</label>
              <input type="text" formControlName="name" class="input-ctrl" placeholder="Ví dụ: Caramel Macchiato" />
            </div>

            <div class="form-grid-2">
              <div class="form-row">
                <label>Giá cơ bản (VNĐ):</label>
                <input type="number" formControlName="giaCoBan" class="input-ctrl" />
              </div>
              <div class="form-row">
                <label>Danh mục:</label>
                <select formControlName="category" class="input-ctrl">
                  <option value="Cà phê">Cà phê</option>
                  <option value="Trà sữa">Trà sữa</option>
                  <option value="Trà trái cây">Trà trái cây</option>
                  <option value="Đặc biệt">Đặc biệt</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <label>Mô tả chi tiết:</label>
              <textarea formControlName="description" rows="2" class="input-ctrl"></textarea>
            </div>

            <!-- Image Upload & Preview [FE-12] -->
            <div class="form-row">
              <label>Ảnh món ăn (URL hoặc Tải lên):</label>
              <div class="upload-row">
                <input type="text" formControlName="imgUrl" class="input-ctrl flex-1" placeholder="https://..." />
                <label class="btn-file-upload">
                  <mat-icon>upload</mat-icon>
                  Upload File
                  <input type="file" (change)="onUploadImage($event)" accept="image/*" />
                </label>
              </div>
              <div class="img-preview" *ngIf="recipeForm.get('imgUrl')?.value">
                <img [src]="recipeForm.get('imgUrl')?.value" alt="Preview" />
              </div>
            </div>

            <div class="form-checkbox">
              <label>
                <input type="checkbox" formControlName="isPopular" />
                Đánh dấu là món Bán chạy / Nổi bật
              </label>
            </div>

            <!-- Toppings Section -->
            <div class="toppings-block">
              <div class="top-head">
                <label>Thành phần & Topping:</label>
                <button type="button" class="btn-add-topping" (click)="addTopping()">
                  + Thêm thành phần
                </button>
              </div>

              <div formArrayName="toppings" class="topping-inputs-list">
                <div
                  *ngFor="let t of toppingsFormArray.controls; let i = index"
                  [formGroupName]="i"
                  class="topping-row"
                >
                  <input type="text" formControlName="name" placeholder="Tên (ví dụ: Sốt Caramel)" class="input-ctrl" />
                  <input type="number" formControlName="quantity" placeholder="SL" class="input-ctrl w-20" />
                  <input type="text" formControlName="unit" placeholder="Đơn vị (ml/g)" class="input-ctrl w-24" />
                  <button type="button" class="btn-del-t" (click)="removeTopping(i)">
                    <mat-icon>remove_circle</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <div class="modal-foot">
              <button type="button" class="btn-modal-cancel" (click)="modalOpen.set(false)">Bỏ qua</button>
              <button type="submit" class="btn-modal-submit" [disabled]="recipeForm.invalid || saving()">
                {{ isEditMode() ? 'Lưu cập nhật' : 'Tạo món mới' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- DELETE CONFIRM MODAL [FE-13] -->
      <app-confirm-dialog
        [isOpen]="deleteDialogOpen()"
        title="Xác nhận xoá món ăn"
        [message]="'Bạn có chắc chắn muốn xoá món ' + (targetRecipe()?.name || '') + ' khỏi thực đơn không?'"
        confirmText="Xoá món ngay"
        cancelText="Bỏ qua"
        type="danger"
        (confirmed)="confirmDeleteRecipe()"
        (cancelled)="deleteDialogOpen.set(false)"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .recipe-mgr-view {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .mgr-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .mgr-title {
      font-size: 22px;
      font-weight: 800;
      color: #1e3932;
      letter-spacing: -0.01em;
      margin-bottom: 4px;
    }
    .mgr-desc {
      font-size: 13px;
      color: rgba(0, 0, 0, 0.58);
    }
    .btn-create-recipe {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 50px;
      background: #00754a;
      color: #ffffff;
      border: none;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 117, 74, 0.3);
    }
    .filter-row {
      display: flex;
      align-items: center;
    }
    .search-input-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: #ffffff;
      border-radius: 50px;
      border: 1px solid #edebe9;
      max-width: 440px;
      width: 100%;
    }
    .search-input-box input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px;
      font-family: inherit;
    }
    .table-card {
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #edebe9;
      overflow-x: auto;
    }
    .sb-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .sb-table th {
      padding: 16px 20px;
      background: #faf6ee;
      color: #1e3932;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #edebe9;
    }
    .sb-table td {
      padding: 14px 20px;
      border-bottom: 1px solid #f2f0eb;
      vertical-align: middle;
    }
    .recipe-thumb {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
    }
    .r-info-cell {
      display: flex;
      flex-direction: column;
      max-width: 280px;
    }
    .r-title {
      font-size: 14px;
      color: #1e3932;
    }
    .r-desc {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cat-tag {
      background: #d4e9e2;
      color: #006241;
      padding: 4px 10px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
    }
    .price-tag {
      font-weight: 800;
      color: #006241;
    }
    .topping-badge {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
    }
    .popular-indicator {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.4);
    }
    .popular-indicator.is-pop {
      color: #cba258;
      font-weight: 700;
    }
    .action-btns {
      display: flex;
      gap: 8px;
    }
    .btn-icon-edit, .btn-icon-del {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 50%;
      display: flex;
      transition: all 0.2s;
    }
    .btn-icon-edit {
      color: #00754a;
      background: #d4e9e2;
    }
    .btn-icon-del {
      color: #c82014;
      background: #fde8e7;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 16px;
    }
    .modal-panel {
      background: #ffffff;
      border-radius: 20px;
      padding: 28px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .modal-header h3 {
      font-size: 18px;
      font-weight: 700;
      color: #1e3932;
    }
    .recipe-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-row label {
      font-size: 13px;
      font-weight: 700;
      color: #1e3932;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .input-ctrl {
      padding: 10px 14px;
      border: 1px solid #d6dbde;
      border-radius: 10px;
      font-size: 14px;
      font-family: inherit;
      outline: none;
    }
    .upload-row {
      display: flex;
      gap: 10px;
    }
    .btn-file-upload {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border-radius: 10px;
      background: #faf6ee;
      border: 1px solid #cba258;
      color: #1e3932;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-file-upload input {
      display: none;
    }
    .img-preview {
      margin-top: 8px;
      height: 120px;
      border-radius: 10px;
      overflow: hidden;
    }
    .img-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .form-checkbox {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
    }
    .toppings-block {
      background: #f2f0eb;
      border-radius: 12px;
      padding: 16px;
    }
    .top-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .btn-add-topping {
      background: none;
      border: none;
      color: #00754a;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }
    .topping-inputs-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .topping-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .w-20 { width: 80px; }
    .w-24 { width: 100px; }
    .btn-del-t {
      background: none;
      border: none;
      color: #c82014;
      cursor: pointer;
      display: flex;
    }
    .modal-foot {
      display: flex;
      gap: 12px;
      margin-top: 12px;
    }
    .btn-modal-cancel, .btn-modal-submit {
      flex: 1;
      padding: 12px;
      border-radius: 50px;
      font-weight: 700;
      border: none;
      cursor: pointer;
    }
    .btn-modal-cancel {
      background: #edebe9;
      color: rgba(0, 0, 0, 0.87);
    }
    .btn-modal-submit {
      background: #00754a;
      color: #ffffff;
    }
  `],
})
export class AdminRecipeManagerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private uploadService = inject(UploadService);
  private toast = inject(ToastService);

  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(true);
  searchControl = new FormControl('');

  modalOpen = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  saving = signal<boolean>(false);
  editingId = signal<string | null>(null);

  deleteDialogOpen = signal<boolean>(false);
  targetRecipe = signal<Recipe | null>(null);

  recipeForm = this.fb.group({
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    giaCoBan: [50000, [Validators.required, Validators.min(0)]],
    category: ['Cà phê', [Validators.required]],
    imgUrl: ['', [Validators.required]],
    isPopular: [false],
    toppings: this.fb.array([]),
  });

  get toppingsFormArray() {
    return this.recipeForm.get('toppings') as FormArray;
  }

  ngOnInit() {
    this.fetchRecipes();
  }

  fetchRecipes() {
    this.loading.set(true);
    const keyword = this.searchControl.value || '';
    this.recipeService.getRecipes(keyword).subscribe({
      next: (data) => {
        this.recipes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  addTopping(name = '', quantity = 10, unit = 'g') {
    this.toppingsFormArray.push(
      this.fb.group({
        name: [name, Validators.required],
        quantity: [quantity, [Validators.required, Validators.min(0)]],
        unit: [unit, Validators.required],
      }),
    );
  }

  removeTopping(index: number) {
    this.toppingsFormArray.removeAt(index);
  }

  openCreateModal() {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.recipeForm.reset({
      name: '',
      description: '',
      giaCoBan: 50000,
      category: 'Cà phê',
      imgUrl: '',
      isPopular: false,
    });
    this.toppingsFormArray.clear();
    this.modalOpen.set(true);
  }

  openEditModal(recipe: Recipe) {
    this.isEditMode.set(true);
    this.editingId.set(recipe.id);
    this.recipeForm.patchValue({
      name: recipe.name,
      description: recipe.description,
      giaCoBan: recipe.giaCoBan,
      category: recipe.category,
      imgUrl: recipe.imgUrl,
      isPopular: recipe.isPopular,
    });
    this.toppingsFormArray.clear();
    if (recipe.toppings && recipe.toppings.length > 0) {
      recipe.toppings.forEach((t) => this.addTopping(t.name, t.quantity, t.unit));
    }
    this.modalOpen.set(true);
  }

  onUploadImage(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadService.uploadImage(file).subscribe({
      next: (res) => {
        this.recipeForm.patchValue({ imgUrl: res.url });
        this.toast.success('Tải ảnh thành công');
      },
    });
  }

  onSaveRecipe() {
    if (this.recipeForm.invalid) return;
    this.saving.set(true);
    const formValue = this.recipeForm.value as any;

    if (this.isEditMode() && this.editingId()) {
      this.recipeService.updateRecipe(this.editingId()!, formValue).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Cập nhật món thành công');
          this.modalOpen.set(false);
          this.fetchRecipes();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.recipeService.createRecipe(formValue).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Tạo món mới thành công');
          this.modalOpen.set(false);
          this.fetchRecipes();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  openDeleteConfirm(recipe: Recipe) {
    this.targetRecipe.set(recipe);
    this.deleteDialogOpen.set(true);
  }

  confirmDeleteRecipe() {
    if (!this.targetRecipe()) return;
    this.recipeService.deleteRecipe(this.targetRecipe()!.id).subscribe({
      next: () => {
        this.toast.success('Đã xoá món ăn khỏi thực đơn');
        this.deleteDialogOpen.set(false);
        this.targetRecipe.set(null);
        this.fetchRecipes();
      },
      error: () => this.deleteDialogOpen.set(false),
    });
  }
}
