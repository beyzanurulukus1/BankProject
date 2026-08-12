import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountDialog } from './create-account-dialog';

describe('CreateAccountDialog', () => {
  let component: CreateAccountDialog;
  let fixture: ComponentFixture<CreateAccountDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAccountDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateAccountDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
