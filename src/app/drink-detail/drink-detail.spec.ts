import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrinkDetail } from './drink-detail';

describe('DrinkDetail', () => {
  let component: DrinkDetail;
  let fixture: ComponentFixture<DrinkDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrinkDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(DrinkDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
