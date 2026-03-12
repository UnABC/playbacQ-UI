import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Hls, { ErrorData, Events } from 'hls.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { VideoService } from '../../core/services/video.service';
import { Video } from '../../core/models/video.model';

@Component({
  selector: 'app-video-player',
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule, MatDividerModule],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css'],
})
export class PlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  private route = inject(ActivatedRoute);
  private videoService = inject(VideoService);
  private cdr = inject(ChangeDetectorRef);
  private hls: Hls | null = null;
  private videoId: string = '';

  isLoading = true;
  videoMetadata: Video | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.videoId = params.get('id') as string;
      this.videoService.getVideoById(this.videoId).subscribe((video) => {
        this.videoMetadata = video;
      });
      this.initPlayer();
    });
  }

  initPlayer(): void {
    const video: HTMLVideoElement = this.videoRef.nativeElement;
    const manifestUrl = `/api/videos/${this.videoId}/play`;

    // Apple系以外のブラウザではHLS.jsを使用して動画を再生
    if (Hls.isSupported()) {
      this.hls = new Hls();
      this.hls.loadSource(manifestUrl);
      this.hls.attachMedia(video);

      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });

      this.hls.on(Hls.Events.ERROR, (event: Events.ERROR, data: ErrorData) => {
        console.warn('HLS.js error:', data);
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          // 403エラーは署名付きURLの有効期限切れの可能性が高いため、URLをリフレッシュして再試行
          if (data.response && data.response.code === 403) {
            console.warn(
              'The video URL may have expired. Attempting to refresh the URL and recover...',
            );

            // 現在の再生位置と再生状態（停止中か再生中か）を退避
            const currentTime = video.currentTime;
            const isPlaying = !video.paused;

            const newManifestUrl = `${manifestUrl}?t=${Date.now()}`;
            this.hls?.loadSource(newManifestUrl);

            // 読み込みが終わったら、元の位置から再開
            this.hls?.once(Hls.Events.MANIFEST_PARSED, () => {
              video.currentTime = currentTime;
              if (isPlaying) {
                video.play();
              }
            });
            return;
          } else if (data.response && data.response.code === 404) {
            console.warn('The video file was not found on the server. It may have been deleted.');
            // TODO: 404ページにリダイレクトするなどの対応を検討
            //alert('動画が見つかりませんでした。動画は削除された可能性があります。');
            return;
          }

          if (data.fatal) {
            console.log('FATAL error encountered, trying to recover...');
            this.hls?.startLoad();
          }
        } else if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('MEDIA_ERROR encountered, trying to recover...');
              this.hls?.recoverMediaError();
              break;
            default:
              this.hls?.destroy();
              break;
          }
        }
      });
      // Apple系ブラウザではネイティブにHLSがサポートされているため、直接動画URLを設定して再生
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifestUrl;
      video.addEventListener('loadedmetadata', () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });

      video.addEventListener('error', (e) => {
        const error = video.error;
        console.warn('Error was occurred on native HLS:', error);
        // エラーコード3 (MEDIA_ERR_DECODE) や 4 (MEDIA_ERR_SRC_NOT_SUPPORTED)
        // これらのエラーは署名付きURLの有効期限切れである可能性が高い
        if (error && (error.code === 3 || error.code === 4)) {
          console.log(
            '動画のURLの有効期限が切れている可能性があります。新しいURLを取得して再試行します。',
          );
          const currentTime = video.currentTime;
          video.src = `${manifestUrl}?t=${Date.now()}`;
          video.currentTime = currentTime;
          video.play();
        }
      });
    } else {
      console.error('HLS is not supported in this browser');
      alert('このブラウザはHLS再生に対応していません。最新のブラウザを使用してください。');
    }
  }

  ngOnDestroy(): void {
    if (this.hls) {
      this.hls.destroy();
    }
  }
}
