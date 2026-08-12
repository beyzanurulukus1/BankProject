import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-create-account-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatRadioModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule
  ],
  templateUrl: './create-account-dialog.html',
  styleUrl: './create-account-dialog.css'
})
export class CreateAccountDialog {

  form;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateAccountDialog>
  ) {

    this.form = this.fb.group({

      currencyId: [1, Validators.required],

      nickname: ['', Validators.required]

    });

  }

  close() {
    this.dialogRef.close();
  }

 create() {

  console.log("CREATE BASILDI");
  console.log(this.form.value);

  this.dialogRef.close(this.form.value);

}

}