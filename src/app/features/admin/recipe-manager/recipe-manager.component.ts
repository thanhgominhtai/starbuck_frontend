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
  templateUrl: './recipe-manager.component.html',
  styleUrl: './recipe-manager.component.css',
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
