import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatCardModule, RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <mat-card class="not-found-card">
        <mat-card-header>
          <mat-card-title>404 Not Found</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-icon class="error-icon" color="warn">error_outline</mat-icon>
          <h3>おっと、ここは未開の地です！ 探検はここまで！</h3>
          <p>
            お探しのページや動画は、異次元に吸い込まれたか、最初から存在しなかったみたいです。
            URLのタイポをチェックするか、東工主がすでに消しちゃった（悲しい）可能性がありますね。
          </p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" routerLink="/">
            <mat-icon>home</mat-icon> ホームに戻る
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 60vh; /* 画面の中央付近に配置 */
        padding: 24px;
      }
      .not-found-card {
        max-width: 500px;
        text-align: center;
        padding: 24px;
      }
      .error-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        margin: 24px 0;
        opacity: 0.8;
      }
      mat-card-actions {
        display: flex;
        justify-content: center;
        margin-top: 16px;
      }
    `,
  ],
})
export class NotFoundComponent {}
