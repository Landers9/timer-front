import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClockActionComponent } from './clock-action.component';

describe('ClockActionComponent', () => {
  let component: ClockActionComponent;
  let fixture: ComponentFixture<ClockActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClockActionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClockActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
