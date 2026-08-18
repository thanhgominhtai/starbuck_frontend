import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormBuilder, Validators, FormArray } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
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
          <h1 class="mgr-title">Quản Trị Thực Đơn Thức Uống & Công Thức</h1>
          <p class="mgr-desc">Tạo mới, chỉnh sửa, tải ảnh và quản lý công thức nước uống riêng biệt của Admin</p>
        </div>

        <button class="btn-create-recipe" (click)="openCreateModal()">
          <mat-icon>add_circle</mat-icon>
          Thêm Nước Uống Mới
        </button>
      </div>

      <!-- Search & Category Dock [FE-07] -->
      <div class="filter-row">
        <div class="search-input-box" [class.has-text]="!!searchControl.value">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            [formControl]="searchControl"
            placeholder="Tìm kiếm nước uống theo tên, nguyên liệu, hương vị..."
          />
          <button
            type="button"
            class="btn-clear-search"
            *ngIf="searchControl.value"
            (click)="clearSearch()"
            title="Xóa tìm kiếm"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Admin Executive Category Segmented Dock -->
        <div class="category-executive-dock">
          <button
            type="button"
            *ngFor="let cat of categories"
            class="dock-pill"
            [class.active]="selectedCategory() === cat.id"
            (click)="selectCategory(cat.id)"
          >
            <mat-icon class="dock-icon">{{ cat.icon }}</mat-icon>
            <span class="dock-name">{{ cat.label }}</span>
            <span class="dock-count" [class.active-count]="selectedCategory() === cat.id">
              {{ getCategoryCount(cat.id) }}
            </span>
          </button>
        </div>
      </div>

      <!-- Recipe Data Table -->
      <div class="table-card">
        <table class="sb-table" *ngIf="!loading() && recipes().length > 0">
          <thead>
            <tr>
              <th>ẢNH</th>
              <th>TÊN THỨC UỐNG & CÔNG THỨC</th>
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
                <span class="cat-tag">{{ r.category || 'Cà phê' }}</span>
              </td>
              <td>
                <span class="price-tag">{{ r.giaCoBan | vndCurrency }}</span>
              </td>
              <td>
                <span class="topping-badge">{{ r.toppings ? r.toppings.length : 0 }} nguyên liệu</span>
              </td>
              <td>
                <div class="trait-badges">
                  <span class="popular-indicator is-pop" *ngIf="r.isPopular" title="Thức uống bán chạy">
                    <mat-icon class="flame-icon">local_fire_department</mat-icon>
                    <span>Bán chạy</span>
                  </span>
                  <span class="special-indicator is-special" *ngIf="r.isSpecial" title="Thức uống đặc biệt / Signature">
                    <mat-icon class="sparkle-icon">auto_awesome</mat-icon>
                    <span>Đặc biệt</span>
                  </span>
                  <span class="standard-badge" *ngIf="!r.isPopular && !r.isSpecial">
                    <span>Tiêu chuẩn</span>
                  </span>
                </div>
              </td>
              <td>
                <div class="action-btns">
                  <button class="btn-icon-edit" (click)="openEditModal(r)" title="Chỉnh sửa">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button class="btn-icon-del" (click)="openDeleteConfirm(r)" title="Xoá thức uống">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="loading()" class="table-loading">Đang tải danh sách công thức nước uống...</div>
        <div *ngIf="!loading() && recipes().length === 0" class="table-empty">
          <mat-icon>local_cafe</mat-icon>
          <p>Chưa có thức uống nào trong kho thực đơn.</p>
        </div>
      </div>

      <!-- CREATE / EDIT MODAL [AD-08, FE-12] -->
      <div class="modal-backdrop" *ngIf="modalOpen()">
        <div class="modal-panel">
          <div class="modal-header">
            <h3>{{ isEditMode() ? 'Chỉnh sửa công thức nước uống' : 'Thêm công thức nước uống mới' }}</h3>
            <button class="btn-close" (click)="modalOpen.set(false)">
              <mat-icon>close</mat-icon>
            </button>
          </div>

          <form [formGroup]="recipeForm" (ngSubmit)="onSaveRecipe()" class="recipe-form">
            <div class="form-row">
              <label>Tên nước uống / công thức:</label>
              <input type="text" formControlName="name" class="input-ctrl" placeholder="Ví dụ: Caramel Macchiato" />
            </div>

            <div class="form-grid-2">
              <div class="form-row">
                <label>Giá cơ bản (VNĐ):</label>
                <input type="number" formControlName="giaCoBan" class="input-ctrl" />
              </div>
              <div class="form-row">
                <label>Thể loại nước uống:</label>
                <select formControlName="category" class="input-ctrl">
                  <option value="Cà phê">Cà phê</option>
                  <option value="Trà sữa">Trà sữa</option>
                  <option value="Trà trái cây">Trà trái cây</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <label>Mô tả hương vị & pha chế:</label>
              <textarea formControlName="description" rows="2" class="input-ctrl"></textarea>
            </div>

            <!-- Image Upload & Preview [FE-12] -->
            <div class="form-row">
              <label>Ảnh nước uống (URL hoặc Tải lên):</label>
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

            <!-- Global Beverage Traits (Admin Configuration) -->
            <div class="form-checkboxes-group">
              <label class="trait-check-item">
                <input type="checkbox" formControlName="isPopular" />
                <span class="trait-check-text">
                  <mat-icon class="trait-icon-flame">local_fire_department</mat-icon>
                  Đánh dấu là thức uống <strong>Bán chạy 🔥</strong> (Hot / Best-Seller)
                </span>
              </label>

              <label class="trait-check-item">
                <input type="checkbox" formControlName="isSpecial" />
                <span class="trait-check-text">
                  <mat-icon class="trait-icon-sparkle">auto_awesome</mat-icon>
                  Đánh dấu là thức uống <strong>Đặc biệt ✨</strong> (Signature / Đặc sản quán)
                </span>
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
                {{ isEditMode() ? 'Lưu cập nhật' : 'Tạo nước uống mới' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- DELETE CONFIRM MODAL [FE-13] -->
      <app-confirm-dialog
        [isOpen]="deleteDialogOpen()"
        title="Xác nhận xoá nước uống"
        [message]="'Bạn có chắc chắn muốn xoá nước uống ' + (targetRecipe()?.name || '') + ' khỏi thực đơn không?'"
        confirmText="Xoá nước uống"
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
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
    .search-input-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      background: #ffffff;
      border-radius: 50px;
      border: 1.5px solid #edebe9;
      width: 320px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease;
    }
    .search-input-box:focus-within, .search-input-box.has-text {
      border-color: #00754a;
      box-shadow: 0 0 0 3px rgba(0, 117, 74, 0.12);
    }
    .search-input-box .search-icon {
      color: #00754a;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .search-input-box input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 13px;
      font-family: inherit;
      color: #1e3932;
    }
    .btn-clear-search {
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      cursor: pointer;
      border-radius: 50%;
      color: rgba(0, 0, 0, 0.4);
      transition: all 0.15s;
    }
    .btn-clear-search:hover {
      background: #edebe9;
      color: #1e3932;
    }
    .btn-clear-search mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Admin Category Executive Dock */
    .category-executive-dock {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f6f3ed;
      border: 1.5px solid #e7e1d4;
      border-radius: 50px;
      padding: 4px 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      overflow-x: auto;
      max-width: 100%;
    }
    .dock-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 14px;
      border-radius: 40px;
      border: 1px solid transparent;
      background: transparent;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 700;
      color: #4a443e;
      white-space: nowrap;
      transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dock-pill:hover {
      background: #ffffff;
      color: #1e3932;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }
    .dock-pill.active {
      background: linear-gradient(135deg, #00754a 0%, #1e3932 100%);
      color: #ffffff;
      border-color: #00754a;
      box-shadow: 0 4px 14px rgba(0, 117, 74, 0.3);
      transform: translateY(-1px);
    }
    .dock-icon {
      font-size: 17px;
      width: 17px;
      height: 17px;
      color: #00754a;
      transition: color 0.2s;
    }
    .dock-pill.active .dock-icon {
      color: #dfc49d;
    }
    .dock-name {
      font-family: inherit;
    }
    .dock-count {
      background: #e9e3d5;
      color: #3c3630;
      font-size: 11px;
      font-weight: 800;
      padding: 1px 7px;
      border-radius: 12px;
      min-width: 18px;
      text-align: center;
      transition: all 0.2s;
    }
    .dock-count.active-count {
      background: rgba(203, 162, 88, 0.3);
      color: #dfc49d;
      border: 1px solid rgba(203, 162, 88, 0.45);
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
    .trait-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    .popular-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 50px;
    }
    .popular-indicator.is-pop {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      color: #e65100;
      border: 1px solid rgba(230, 81, 0, 0.25);
      box-shadow: 0 2px 6px rgba(230, 81, 0, 0.12);
    }
    .popular-indicator .flame-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #ff5722;
    }
    .special-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 50px;
      background: linear-gradient(135deg, #fdf8e6 0%, #faecd0 100%);
      color: #8c6819;
      border: 1px solid rgba(203, 162, 88, 0.4);
      box-shadow: 0 2px 6px rgba(203, 162, 88, 0.15);
    }
    .special-indicator .sparkle-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #cba258;
    }
    .standard-badge {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.4);
      background: #f4f2ee;
      padding: 3px 9px;
      border-radius: 50px;
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
      margin: 0;
    }
    .btn-close {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f2f0eb;
      border: 1px solid #e0dedc;
      color: #1e3932;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn-close mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: transform 0.25s;
    }
    .btn-close:hover {
      background: #edebe9;
      color: #c82014;
      border-color: #c82014;
      transform: rotate(90deg) scale(1.08);
      box-shadow: 0 2px 8px rgba(200, 32, 20, 0.2);
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
    .form-checkboxes-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #faf8f5;
      border: 1px solid #ede8dc;
      padding: 12px 16px;
      border-radius: 12px;
    }
    .trait-check-item {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 13px;
      color: #1e3932;
    }
    .trait-check-item input {
      width: 17px;
      height: 17px;
      accent-color: #00754a;
      cursor: pointer;
    }
    .trait-check-text {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .trait-icon-flame {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #ff5722;
    }
    .trait-icon-sparkle {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #cba258;
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
export class AdminRecipeManagerComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private recipeService = inject(RecipeService);
  private uploadService = inject(UploadService);
  private toast = inject(ToastService);
  private sub = new Subscription();

  recipes = signal<Recipe[]>([]);
  allRecipesForCount = signal<Recipe[]>([]);
  loading = signal<boolean>(true);
  searchControl = new FormControl('');

  readonly categories = [
    { id: 'all', label: 'Tất cả', icon: 'dashboard_customize' },
    { id: 'Cà phê', label: 'Cà phê', icon: 'local_cafe' },
    { id: 'Trà sữa', label: 'Trà sữa', icon: 'bubble_chart' },
    { id: 'Trà trái cây', label: 'Trà trái cây', icon: 'nature' },
    { id: 'Đặc biệt', label: 'Đặc biệt', icon: 'auto_awesome' },
  ];
  selectedCategory = signal<string>('all');

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
    isSpecial: [false],
    toppings: this.fb.array([]),
  });

  get toppingsFormArray() {
    return this.recipeForm.get('toppings') as FormArray;
  }

  ngOnInit() {
    this.fetchRecipes();

    // Debounced real-time live search (300ms buffer)
    const searchSub = this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.fetchRecipes(true);
      });
    this.sub.add(searchSub);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  clearSearch() {
    this.searchControl.setValue('');
  }

  selectCategory(catId: string) {
    this.selectedCategory.set(catId);
    this.fetchRecipes(true);
  }

  getCategoryCount(catId: string): number {
    const all = this.allRecipesForCount();
    if (catId === 'all') return all.length;
    if (catId === 'Đặc biệt') return all.filter((r) => r.isSpecial).length;
    return all.filter((r) => r.category === catId).length;
  }

  fetchRecipes(showLoading: boolean = true) {
    if (showLoading) this.loading.set(true);
    const keyword = this.searchControl.value?.trim() || '';
    const category = this.selectedCategory();

    this.recipeService.getRecipes(keyword, category).subscribe({
      next: (data) => {
        this.recipes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });

    // Keep counts accurate across all categories
    this.recipeService.getRecipes('').subscribe({
      next: (all) => {
        this.allRecipesForCount.set(all);
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
      isSpecial: false,
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
      isPopular: recipe.isPopular || false,
      isSpecial: recipe.isSpecial || false,
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
          this.toast.success('Cập nhật nước uống thành công');
          this.modalOpen.set(false);
          this.fetchRecipes();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.recipeService.createRecipe(formValue).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Tạo nước uống mới thành công');
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
        this.toast.success('Đã xoá nước uống khỏi thực đơn');
        this.deleteDialogOpen.set(false);
        this.targetRecipe.set(null);
        this.fetchRecipes();
      },
      error: () => this.deleteDialogOpen.set(false),
    });
  }
}
