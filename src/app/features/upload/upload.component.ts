import { Component, inject, ViewChild } from '@angular/core';
import { VideoService } from '../../core/services/video.service';
import { UploadService } from '../../core/services/upload.service';
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
import { HttpEventType } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { switchMap, tap, filter } from 'rxjs/operators';

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
    MatProgressBarModule,
  ],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent {
  videoService = inject(VideoService);
  uploadService = inject(UploadService);
  isDragging = false;
  isUploadStarted = false;

  selectedFile: File | null = null;
  videoTitle: string = '';
  videoDescription: string = '';
  uploadProgress: number = 0;
  uploadStatusMessage: string = '';
  @ViewChild('stepper') private stepper!: MatStepper;

  steps = ['動画の選択', '基本情報の入力', 'アップロード', '完了'];

  videoForm = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
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
    if (!this.selectedFile) {
      alert('動画ファイルが選択されていません。');
      return;
    }
    const { title, description } = this.videoForm.getRawValue();
    this.isUploadStarted = true;
    setTimeout(() => {
      this.stepper.next();
      this.videoService
        .createVideo(title, description)
        .pipe(
          switchMap((videos) => {
            this.uploadStatusMessage = 'MinIOへアップロード中...';
            return this.uploadService.uploadToMinio(videos.uploadUrl, this.selectedFile!).pipe(
              tap((event) => {
                if (event.type === HttpEventType.UploadProgress && event.total) {
                  this.uploadProgress = Math.round((100 * event.loaded) / event.total);
                }
              }),
              // アップロード中(Progress)のイベントはここで堰き止め、完了(Response)だけを下へ流す
              filter((event) => event.type === HttpEventType.Response),
              switchMap(() => {
                this.uploadStatusMessage = 'バックエンドでエンコード処理中...';
                this.uploadProgress = 0;
                return this.videoService.pollUploadProgress(videos.id).pipe(
                  tap((progress) => {
                    this.uploadStatusMessage = `エンコード処理中... (${progress.progress}%)`;
                    this.uploadProgress = progress.progress;
                    if (progress.status === 'completed') {
                      this.uploadStatusMessage = 'アップロードとエンコードが完了しました！';
                    } else if (progress.status === 'failed') {
                      this.uploadStatusMessage = 'エンコードに失敗しました。';
                    }
                  })
                );
              }),
            );
          }),
        )
        .subscribe({
          next: (videos) => {
            // 全てが完了
            console.log('動画の作成とアップロードが完了しました。', videos);
            this.stepper.next();
          },
          error: (err) => {
            console.error('通信エラーが発生しました…', err);
            alert('動画の作成に失敗しました。もう一度お試しください。');
            this.stepper.previous();
          },
        });
    });
  }
}
