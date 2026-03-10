import { Component, inject, ViewChild } from '@angular/core';
import { VideoService } from '../../core/services/video.service';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import {
  FormGroup,
  FormControl,
  FormsModule,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    MatStepperModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent {
  videoService = inject(VideoService);

  isDragging = false;
  isUploadStarted = false;

  selectedFile: File | null = null;
  videoTitle: string = '';
  videoDescription: string = '';
  // 0:動画選択、1:動画情報入力、2:アップロード中、3:完了
  @ViewChild('stepper') private stepper!: MatStepper;

  steps = ['動画の選択', '基本情報の入力', 'アップロード', '完了'];

  videoForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
  });

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  get hasFile(): boolean {
    return this.selectedFile !== null;
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('video/')) {
      alert('動画ファイルを選択してください。');
      return;
    }
    this.selectedFile = file;
    console.log('selectedFile:', file.name);
    // 画面の更新を待ってから次のステップに進む
    setTimeout(() => {
      this.stepper.next();
    });
  }

  startUpload() {
    if (this.videoForm.invalid) {
      return;
    }
    this.isUploadStarted = true;
    setTimeout(() => {
      this.stepper.next();
      // TODO: アップロード処理を開始！！
    });
  }
}
