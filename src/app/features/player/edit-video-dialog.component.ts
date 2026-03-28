import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface EditVideoDialogData {
  title: string;
  description: string;
}

@Component({
  selector: 'app-edit-video-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>動画の編集</h2>
    <mat-dialog-content class="form-container">
      <form [formGroup]="videoForm">
        <mat-form-field
          appearance="outline"
          class="full-width"
          style="width: 100%; margin-top: 8px;"
        >
          <mat-label>動画のタイトル (必須)</mat-label>
          <input matInput formControlName="title" required />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" style="width: 100%;">
          <mat-label>動画の説明</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="5"
            class="no-resize"
            style="resize: none;"
          ></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions
      align="end"
      class="button-actions"
      style="margin-bottom: 8px; margin-right: 8px;"
    >
      <button mat-stroked-button mat-dialog-close type="button">キャンセル</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="videoForm.invalid"
        (click)="save()"
      >
        保存
      </button>
    </mat-dialog-actions>
  `,
})
export class EditVideoDialogComponent {
  videoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditVideoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditVideoDialogData,
  ) {
    this.videoForm = this.fb.group({
      title: [data.title, Validators.required],
      description: [data.description],
    });
  }

  save(): void {
    if (this.videoForm.valid) {
      this.dialogRef.close(this.videoForm.value);
    }
  }
}
