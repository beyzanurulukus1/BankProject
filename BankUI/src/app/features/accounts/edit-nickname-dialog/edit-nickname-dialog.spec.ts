import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNicknameDialog } from './edit-nickname-dialog';

describe('EditNicknameDialog', () => {
  let component: EditNicknameDialog;
  let fixture: ComponentFixture<EditNicknameDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNicknameDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(EditNicknameDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
