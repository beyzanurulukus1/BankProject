import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule
} from '@angular/material/dialog';

import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-edit-nickname-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  templateUrl: './edit-nickname-dialog.html',
  styleUrl: './edit-nickname-dialog.css'
})
export class EditNicknameDialog {





  form;

  constructor(
    private fb: FormBuilder,
  
    public dialogRef: MatDialogRef<EditNicknameDialog>,
  
    @Inject(MAT_DIALOG_DATA)
    public data: {
      accountId: number;
      nickname: string;
    }
  ) {
  
    this.form = this.fb.group({
      nickname: [
        data.nickname,
        [Validators.required, Validators.maxLength(50)]
      ]
    });
  
  }

  save() {

    if (this.form.invalid) return;
  
    this.dialogRef.close({
  
      accountId: this.data.accountId,
  
      nickname: this.form.value.nickname
  
    });
  
  }
  cancel() {
    this.dialogRef.close();
  }
}