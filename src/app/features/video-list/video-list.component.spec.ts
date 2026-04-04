import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VideoListComponent } from './video-list.component';
import { VideoService } from '../../core/services/video.service';
import { CommentService } from '../../core/services/comment.service';
import { of, BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';

const queryParamsSubject = new BehaviorSubject<any>({});

describe('VideoListComponent', () => {
  let component: VideoListComponent;
  let fixture: ComponentFixture<VideoListComponent>;
  let videoService: VideoService;
  let commentService: CommentService;
  beforeEach(async () => {
    const mockVideoService = {
      getVideos: vi.fn().mockReturnValue(of([])),
    };
    const mockCommentService = {
      getComments: vi.fn().mockReturnValue(of({})),
    };
    await TestBed.configureTestingModule({
      imports: [VideoListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: VideoService, useValue: mockVideoService },
        { provide: CommentService, useValue: mockCommentService },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: queryParamsSubject.asObservable() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoListComponent);
    component = fixture.componentInstance;
    videoService = TestBed.inject(VideoService);
    commentService = TestBed.inject(CommentService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // 純粋関数(formatDuration)のテスト
  it('should format duration correctly', () => {
    expect(component.formatDuration(0)).toBe('0:00');
    expect(component.formatDuration(59)).toBe('0:59');
    expect(component.formatDuration(60)).toBe('1:00');
    expect(component.formatDuration(61)).toBe('1:01');
    expect(component.formatDuration(3599)).toBe('59:59');
    expect(component.formatDuration(3600)).toBe('1:00:00');
    expect(component.formatDuration(3661)).toBe('1:01:01');
  });
  // 検索のテスト
  it('should call getVideos with correct parameters on init', () => {
    const getVideosSpy = vi.spyOn(videoService, 'getVideos').mockReturnValue(of([]));
    queryParamsSubject.next({
      search: 'test',
      sortby: 'title',
      order: 1,
      tag: 'tag1',
    });
    expect(getVideosSpy).toHaveBeenCalledWith({
      search: 'test',
      sortby: 'title',
      order: 1,
      tag: 'tag1',
    });
  });
  // ソート変更のテスト
  it('should navigate with correct query params on sort change', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.currentOrder = 1;
    component.onSortChange('title');
    expect(navigateSpy).toHaveBeenCalledWith([], {
      relativeTo: component['route'],
      queryParams: { sortby: 'title', order: 1 },
      queryParamsHandling: 'merge',
    });
  });
  // 順序変更のテスト
  it('should navigate with correct query params on order change', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.currentSort = 'title';
    component.onOrderChange(0);
    expect(navigateSpy).toHaveBeenCalledWith([], {
      relativeTo: component['route'],
      queryParams: { sortby: 'title', order: 0 },
      queryParamsHandling: 'merge',
    });
  });
  // DOM描画のテスト
  it('should update videoList when getVideos returns data', () => {
    const mockVideos = [
      { id: 1, title: 'Video 1', duration: 120 },
      { id: 2, title: 'Video 2', duration: 240 },
    ] as any;
    const mockComments = [
      { video_id: 1, content: 'Comment 1' },
      { video_id: 1, content: 'Comment 2' },
      { video_id: 1, content: 'Comment 3' },
    ] as any[];
    vi.spyOn(videoService, 'getVideos').mockReturnValue(of(mockVideos));
    vi.spyOn(commentService, 'getComments').mockReturnValue(of(mockComments));
    queryParamsSubject.next({});
    expect(component.videoList).toEqual(mockVideos);
    fixture.detectChanges();
    const videoCards = fixture.debugElement.queryAll(By.css('.video-card'));
    expect(videoCards.length).toBe(2);
    expect(videoCards[0].nativeElement.textContent).toContain('Video 1');
    expect(videoCards[0].nativeElement.textContent).toContain('2:00');
    expect(videoCards[1].nativeElement.textContent).toContain('Video 2');
    expect(videoCards[1].nativeElement.textContent).toContain('4:00');
    expect(component.commentCount(mockVideos[0])).toBe(3);
  });
  it('should return message when videoList is empty', () => {
    component.videoList = [];
    fixture.detectChanges();
    const messageElement = fixture.debugElement.query(By.css('.empty-state')).nativeElement;
    expect(messageElement.textContent).toContain('見つかりませんでした');
  });
});
