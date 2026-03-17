import { Component, signal, inject } from '@angular/core';
import { UploadComponent } from './features/upload/upload.component';
import { RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { VideoListComponent } from './features/video-list/video-list.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    VideoListComponent,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('playbacQ-UI');
  dialog = inject(MatDialog);

  openUploadDialog() {
    const dialogRef = this.dialog.open(UploadComponent, {
      width: '700px',
      maxWidth: '80vw',
      maxHeight: '70vh',
      disableClose: true, // アップロード中に誤って枠外クリックで閉じないように保護
      autoFocus: false,
    });

    // 閉じた後の処理（必要に応じて動画リストの更新などを行う）
    dialogRef.afterClosed().subscribe(() => {});
  }
}
