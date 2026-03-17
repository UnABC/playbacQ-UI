import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { VideoService } from '../../core/services/video.service';
import { Video } from '../../core/models/video.model';

@Component({
  selector: 'app-video-list',
  standalone: true,
  imports: [MatCardModule, RouterLink, DatePipe],
  templateUrl: './video-list.component.html',
  styleUrls: ['./video-list.component.css'],
})
export class VideoListComponent implements OnInit {
  videoService = inject(VideoService);
  cdr = inject(ChangeDetectorRef);

  videoList: Video[] = [];

  ngOnInit() {
    this.videoService.getVideos({}).subscribe((videos) => {
      this.videoList = videos;
      this.cdr.detectChanges();
    });
  }
}
