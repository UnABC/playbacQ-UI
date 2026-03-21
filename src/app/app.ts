import { Component, signal, inject } from '@angular/core';
import { UploadComponent } from './features/upload/upload.component';
import { RouterModule, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('playbacQ-UI');
  dialog = inject(MatDialog);
  private router = inject(Router);

  openUploadDialog() {
    const dialogRef = this.dialog.open(UploadComponent, {
      width: '700px',
      maxWidth: '80vw',
      maxHeight: '70vh',
      disableClose: true, // アップロード中に誤って枠外クリックで閉じないように保護
      autoFocus: false,
    });

    // 閉じた後の処理（必要に応じて動画リストの更新などを行う）
    dialogRef.afterClosed().subscribe(() => {
      this.router.navigate(['/'], { queryParams: { reload: new Date().getTime() } });
    });
  }

  onSearch(keyword: string) {
    if (keyword.trim()) {
      if (keyword.length > 1024) {
        alert('あり得ないことが起きています。HTMLを改竄していませんか？');
        return;
      }
      // ホーム画面（/）にクエリパラメータ ?search=keyword を付けて遷移
      this.router.navigate(['/'], { queryParams: { search: keyword } });
    } else {
      // キーワードが空ならパラメータなしでホームへ
      this.router.navigate(['/']);
    }
  }
}
