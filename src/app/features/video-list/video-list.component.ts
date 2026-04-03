import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { VideoService } from '../../core/services/video.service';
import { CommentService } from '../../core/services/comment.service';
import { Video } from '../../core/models/video.model';
import { Comment } from '../../core/models/video.model';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [
    MatCardModule,
    RouterLink,
    DatePipe,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
  ],
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css'],
})
export class VideoListComponent implements OnInit {
  private videoService = inject(VideoService);
  private commentService = inject(CommentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  videoList: Video[] = [];
  currentSort = 'created_at';
  currentOrder: number = 0;
  commentCounts: { [videoId: string]: number } = {};

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.currentSort = params['sortby'] || 'created_at';
      this.currentOrder = params['order'] !== undefined ? +params['order'] : 0;

      this.videoService
        .getVideos({
          ...(params['search'] && { search: params['search'] }),
          sortby: this.currentSort,
          order: this.currentOrder,
          ...(params['tag'] && { tag: params['tag'] }),
        })
        .subscribe((videos) => {
          this.videoList = videos;
          this.cdr.detectChanges();

          videos.forEach((video) => {
            this.commentService.getComments(video.video_id).subscribe((comments: Comment[]) => {
              this.commentCounts[video.video_id] = comments.length;
              this.cdr.detectChanges();
            });
          });
        });
    });
  }

  onSortChange(value: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortby: value, order: this.currentOrder },
      queryParamsHandling: 'merge',
    });
  }

  onOrderChange(value: number) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sortby: this.currentSort, order: value },
      queryParamsHandling: 'merge',
    });
  }

  commentCount(video: Video): number {
    return this.commentCounts[video.video_id] || 0;
  }

  formatDuration(seconds: number | undefined): string {
    if (!seconds) return '0:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    if (h > 0) {
      return `${h}:${mStr}:${sStr}`; // 1時間以上の場合
    } else {
      // YouTubeっぽく、10分未満でも分はゼロ埋めしない（例: 4:05）
      return `${m}:${sStr}`;
    }
  }
}
