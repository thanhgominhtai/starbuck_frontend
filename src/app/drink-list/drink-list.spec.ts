import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrinkList } from './drink-list';

describe('DrinkList', () => {
  let component: DrinkList;
  let fixture: ComponentFixture<DrinkList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrinkList],
    }).compileComponents();

    fixture = TestBed.createComponent(DrinkList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
