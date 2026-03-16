import {
  Component,
  inject,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import Hls, { ErrorData, Events } from 'hls.js';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { VideoService } from '../../core/services/video.service';
import { CommentService } from '../../core/services/comment.service';
import { Video } from '../../core/models/video.model';
import { Comment } from './comment';
import { LinkifyPipe } from '../../shared/pipes/linkify-pipe';
import * as Plyr_ from 'plyr';
import type PlyrType from 'plyr';
const Plyr = (Plyr_ as any).default || Plyr_;
type Plyr = PlyrType;

@Component({
  selector: 'app-video-player',
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule, MatDividerModule, LinkifyPipe],
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css'],
})
export class PlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('commentInput') commentInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('commandInput') commandInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('commentCanvas') commentCanvasRef!: ElementRef<HTMLCanvasElement>;

  private route = inject(ActivatedRoute);
  private videoService = inject(VideoService);
  private commentService = inject(CommentService);
  private cdr = inject(ChangeDetectorRef);
  private hls: Hls | null = null;
  private videoId: string = '';
  private player: Plyr | null = null;
  private viewTimer: any;
  private hasCountedView = false;
  private commentSubscription: Subscription | null = null;
  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private comments: Comment[] = [];

  isLoading = true;
  videoMetadata: Video | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.videoId = params.get('id') as string;
      this.videoService.getVideoById(this.videoId).subscribe((video) => {
        this.videoMetadata = video;
      });
      this.initPlayer();
      this.commentService.getComments(this.videoId).subscribe((comments) => {
        comments.map((c) => {
          this.comments.push(new Comment(c.comment, c.timestamp, c.command));
        });
        this.decideYPosition();
      });

      this.startCommentLoop();
      this.commentService.connect(this.videoId);
      this.commentSubscription = this.commentService.messages$.subscribe((msg) => {
        console.log('Received comment via WebSocket:', msg);
        this.comments.push(new Comment(msg.content, msg.timestamp, msg.command));
        this.decideYPosition();
      });
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.commentCanvasRef.nativeElement;
    canvas.width = 1920;
    canvas.height = 1080;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    this.ctx = canvas.getContext('2d')!;
  }

  startCommentLoop(): void {
    const loop = () => {
      if (!this.ctx || !this.player) {
        this.animationFrameId = requestAnimationFrame(loop);
        return;
      }

      this.ctx.clearRect(0, 0, 1920, 1080);

      for (const comment of this.comments) {
        comment.draw(this.ctx, this.player.currentTime);
      }
      // 次のフレームを予約
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
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
        this.initPlyr(video);
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
        this.initPlyr(video);
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

  initPlyr(video: HTMLVideoElement): void {
    this.player = new Plyr(video, {
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'settings',
        'fullscreen',
      ],
      settings: ['quality', 'speed', 'loop'],
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true },
      storage: { enabled: true, key: 'playbacq-plyr' },
      speed: { selected: 1, options: [0.5, 1, 1.25, 1.5, 1.75, 2, 3] },
      previewThumbnails: {
        enabled: true,
        src: `/api/videos/${this.videoId}/vtt`,
      },
    });

    if (this.player !== null) {
      const countViewTime = Math.min((this.videoMetadata?.duration ?? 0) / 4, 300) * 1000;
      this.player.on('ready', () => {
        const plyrVideoWrapper = video.closest('.plyr__video-wrapper');
        if (plyrVideoWrapper && this.commentCanvasRef) {
          plyrVideoWrapper.appendChild(this.commentCanvasRef.nativeElement);
        }
      });
      this.player.on('playing', () => {
        if (!this.hasCountedView) {
          // 再生が始まったら10秒後にカウントAPIを叩くタイマーをセット！
          this.viewTimer = setTimeout(() => {
            this.videoService.incrementViewCount(this.videoId).subscribe(() => {
              console.log('View count incremented for video ID:', this.videoId);
              this.hasCountedView = true;
            });
          }, countViewTime);
        }
      });

      // 一時停止やシーク（飛ばし）を検知したらタイマーを潰す！
      this.player.on('pause', () => clearTimeout(this.viewTimer));
      this.player.on('seeking', () => clearTimeout(this.viewTimer));

      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  decideYPosition(): void {
    this.comments.sort((a, b) => a.timestamp - b.timestamp);
    const experimentTime = Array.from({ length: 3 }, () => new Float64Array(1080));
    const heightOfComment = Array.from({ length: 3 }, () => new Float64Array(1080));
    const vaild = Array.from({ length: 3 }, () => new Int8Array(1080).fill(0));
    for (const comment of this.comments) {
      // 注：上端は4
      let y = 4;
      let breakFlag = false;
      let index = 0;
      if (comment.position === 'ue') {
        index = 1;
      } else if (comment.position === 'shita') {
        index = 2;
      }
      if (comment.position !== 'shita') {
        for (let empty_y = 0; y < 1050; y++) {
          empty_y++;
          if (vaild[index][y]) {
            // 消費期限切れはリセット
            if (experimentTime[index][y] < comment.timestamp) {
              vaild[index][y] = 0;
            } else {
              empty_y = 0;
              y += heightOfComment[index][y] + 1;
            }
          }
          if (empty_y >= comment.height) {
            comment.y = y - comment.height + 1;
            breakFlag = true;
            break;
          }
        }
        if (breakFlag) {
          for (let fill_y = Math.floor(comment.y); fill_y < comment.y + comment.height; fill_y++) {
            experimentTime[index][fill_y] = comment.timestamp + comment.appearTime;
            heightOfComment[index][fill_y] = comment.height - (fill_y - comment.y);
            vaild[index][fill_y] = 1;
          }
        } else {
          comment.y = Math.random() * (1080 - comment.height - 8) + 4;
        }
      } else {
        y = 1076;
        for (let empty_y = 0; y >= 0; y--) {
          empty_y++;
          if (vaild[index][y]) {
            // 消費期限切れはリセット
            if (experimentTime[index][y] < comment.timestamp) {
              vaild[index][y] = 0;
            } else {
              empty_y = 0;
              y -= heightOfComment[index][y] + 1;
            }
          }
          if (empty_y >= comment.height) {
            comment.y = y;
            breakFlag = true;
            break;
          }
        }
        if (breakFlag) {
          for (let fill_y = Math.floor(comment.y); fill_y < comment.y + comment.height; fill_y++) {
            experimentTime[index][fill_y] = comment.timestamp + comment.appearTime;
            heightOfComment[index][fill_y] = fill_y - comment.y;
            vaild[index][fill_y] = 1;
          }
        } else {
          comment.y = Math.random() * (1080 - comment.height - 8) + 4;
        }
      }
    }
  }

  isCommandMenuOpen = false;
  toggleCommandMenu(): void {
    this.isCommandMenuOpen = !this.isCommandMenuOpen;
  }

  // コマンドの定義一覧
  private readonly CMD_COLORS = [
    'white',
    'black',
    'gray',
    'brown',
    'green',
    'cyan',
    'blue',
    'yellow',
    'orange',
    'red',
  ];
  private readonly CMD_POSITIONS = ['ue', 'shita', 'naka'];
  private readonly CMD_SIZES = ['big', 'medium', 'small'];

  toggleCommand(cmd: string, cmdInput: HTMLInputElement): void {
    let currentCmds = cmdInput.value
      .toLowerCase()
      .split(/\s+/)
      .filter((c) => c !== '');
    const isColor = this.CMD_COLORS.includes(cmd);
    const isPos = this.CMD_POSITIONS.includes(cmd);
    const isSize = this.CMD_SIZES.includes(cmd);

    if (isColor) currentCmds = currentCmds.filter((c) => !this.CMD_COLORS.includes(c));
    if (isPos) currentCmds = currentCmds.filter((c) => !this.CMD_POSITIONS.includes(c));
    if (isSize) currentCmds = currentCmds.filter((c) => !this.CMD_SIZES.includes(c));

    currentCmds.push(cmd);
    cmdInput.value = currentCmds.join(' ');
  }

  sendComment(): void {
    if (!this.player) {
      console.warn('Player is not initialized yet. Cannot send comment.');
      return;
    }
    const commentText = this.commentInputRef.nativeElement.value.trim();
    const commandText = this.commandInputRef.nativeElement.value.trim();
    if (!commentText) {
      return;
    }
    const currentTime = this.player?.currentTime ?? 0;
    this.comments.push(new Comment(commentText, currentTime, commandText));
    this.decideYPosition();
    this.commentService
      .postComment(this.videoId, commentText, currentTime, commandText)
      .subscribe(() => {
        console.log('Comment:', commentText, 'at', currentTime, 'with commands:', commandText);
      });
    this.commentInputRef.nativeElement.value = '';
  }

  ngOnDestroy(): void {
    if (this.hls) {
      this.hls.destroy();
    }
    if (this.commentSubscription) {
      this.commentSubscription.unsubscribe();
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.commentService.disconnect();
  }
}
