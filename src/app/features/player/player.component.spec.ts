import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerComponent } from './player.component';
import { TagService } from '../../core/services/tag.service';
import { VideoService } from '../../core/services/video.service';
import { CommentService } from '../../core/services/comment.service';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { By } from '@angular/platform-browser';

let mockPlayingCallback: Function | null = null;
let mockPauseCallback: Function | null = null;
let mockSeekingCallback: Function | null = null;

vi.mock('plyr', () => {
  class MockPlyr {
    constructor() {}
    on(eventName: string, callback: Function) {
      if (eventName === 'playing') {
        mockPlayingCallback = callback;
      } else if (eventName === 'pause') {
        mockPauseCallback = callback;
      } else if (eventName === 'seeking') {
        mockSeekingCallback = callback;
      }
    }
  }
  return { default: MockPlyr };
});

describe('PlayerComponent', () => {
  let component: PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;
  let tagService: TagService;
  let videoService: VideoService;
  let commentService: CommentService;
  let messagesSubject: Subject<any>;
  beforeEach(async () => {
    messagesSubject = new Subject<any>();
    const mockTagService = {
      getTag: vi.fn().mockReturnValue(of([])),
    };
    const mockVideoService = {
      addVideoTag: vi.fn().mockReturnValue(of(undefined)),
      getVideoById: vi.fn().mockReturnValue(
        of({
          video_id: 'ABCD1234',
          title: 'Test Video',
          user_id: 'user',
          description: 'A test video',
          duration: 40,
        }),
      ),
      removeVideoTag: vi.fn().mockReturnValue(of(undefined)),
      incrementViewCount: vi.fn().mockReturnValue(of({} as any)),
    };
    const mockCommentService = {
      postComment: vi.fn().mockReturnValue(of({})),
      connect: vi.fn().mockReturnValue(of({} as any)),
      disconnect: vi.fn(),
      getComments: vi.fn().mockReturnValue(of([])),
      messages$: messagesSubject.asObservable(),
    };
    await TestBed.configureTestingModule({
      imports: [PlayerComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TagService, useValue: mockTagService },
        { provide: VideoService, useValue: mockVideoService },
        { provide: CommentService, useValue: mockCommentService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerComponent);
    component = fixture.componentInstance;
    videoService = TestBed.inject(VideoService);
    commentService = TestBed.inject(CommentService);
    component.videoMetadata = {
      video_id: 'ABCD1234',
      title: 'Test Video',
      user_id: 'user',
      description: 'A test video',
      duration: 40,
    } as any;
    tagService = TestBed.inject(TagService);
    vi.useFakeTimers();
    fixture.detectChanges();
    (component as any).videoId = 'ABCD1234';
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // タグのサジェストテスト
  it('should suggest tags based on input after 300ms', async () => {
    const getTagSpy = vi
      .spyOn(tagService, 'getTag')
      .mockReturnValue(of([{ tag_id: 1, name: 'test', status: 0 }]));
    component.onTagInput({ target: { value: 'test' } } as any);
    await vi.advanceTimersByTimeAsync(299);
    expect(getTagSpy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(getTagSpy).toHaveBeenCalledTimes(1);
    expect(getTagSpy).toHaveBeenCalledWith('test');
  });
  it('should cancel suggesting tags if input changes before 300ms', async () => {
    const getTagSpy = vi
      .spyOn(tagService, 'getTag')
      .mockReturnValue(of([{ tag_id: 1, name: 'test', status: 0 }]));
    component.onTagInput({ target: { value: 'te' } } as any);
    await vi.advanceTimersByTimeAsync(200);
    component.onTagInput({ target: { value: 'tes' } } as any);
    await vi.advanceTimersByTimeAsync(200);
    expect(getTagSpy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(getTagSpy).toHaveBeenCalledTimes(1);
    expect(getTagSpy).toHaveBeenCalledWith('tes');
  });
  // タグの追加の確認テスト
  it('confirms tag selection', () => {
    const confirmTagSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const addVideoTagSpy = vi.spyOn(videoService, 'addVideoTag').mockReturnValue(of(undefined));
    component.addTag('test');
    expect(confirmTagSpy).toHaveBeenCalledWith('タグ test を追加しますか？');
    expect(addVideoTagSpy).toHaveBeenCalledWith('ABCD1234', 'test');
  });
  it('should refuse adding too long tag', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.addTag('a'.repeat(41));
    expect(alertSpy).toHaveBeenCalledWith(
      'あり得ないことが起きています。HTMLを改竄していませんか？',
    );
  });
  // タグの削除の確認テスト
  it('confirms tag deletion', () => {
    const confirmTagSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const deleteVideoTagSpy = vi
      .spyOn(videoService, 'removeVideoTag')
      .mockReturnValue(of(undefined));
    const mockTag = { tag_id: 1, name: 'test', status: 0 };
    component.removeTag(mockTag);
    expect(confirmTagSpy).toHaveBeenCalledWith('タグ test を削除しますか？');
    expect(deleteVideoTagSpy).toHaveBeenCalledWith('ABCD1234', mockTag);
  });
  // コメント入力テスト
  it('should update command selection', () => {
    const commandInputEl = fixture.debugElement.query(By.css('.command-input'))
      .nativeElement as HTMLInputElement;
    component.toggleCommand('red', commandInputEl);
    expect(commandInputEl.value).toBe('red');
    component.toggleCommand('blue', commandInputEl);
    expect(commandInputEl.value).toBe('blue');
  });
  it('postComment test', () => {
    const commentInputEl = fixture.debugElement.query(By.css('.comment-input'))
      .nativeElement as HTMLInputElement;
    const commandInputEl = fixture.debugElement.query(By.css('.command-input'))
      .nativeElement as HTMLInputElement;
    commentInputEl.value = 'Test Comment';
    commandInputEl.value = 'ue big red';
    const postCommentSpy = vi.spyOn(commentService, 'postComment').mockReturnValue(of({} as any));
    (component as any).player = { currentTime: 120 };
    const sendButton = fixture.debugElement.query(By.css('.comment-send-btn')).nativeElement;
    sendButton.click();
    expect(postCommentSpy).toHaveBeenCalledWith(
      component['videoId'],
      'Test Comment',
      120,
      'ue big red',
    );
  });
  it('should cancel posting comment when comment or command is too long', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const commentInputEl = fixture.debugElement.query(By.css('.comment-input'))
      .nativeElement as HTMLInputElement;
    const commandInputEl = fixture.debugElement.query(By.css('.command-input'))
      .nativeElement as HTMLInputElement;
    commentInputEl.value = 'a'.repeat(201);
    commandInputEl.value = 'red';
    const sendButton = fixture.debugElement.query(By.css('.comment-send-btn')).nativeElement;
    sendButton.click();
    expect(alertSpy).toHaveBeenCalledWith(
      'あり得ないことが起きています。HTMLを改竄していませんか？',
    );
    commentInputEl.value = 'Test Comment';
    commandInputEl.value = 'a'.repeat(129);
    sendButton.click();
    expect(alertSpy).toHaveBeenCalledWith(
      'あり得ないことが起きています。HTMLを改竄していませんか？',
    );
  });
  // WebSocketからのリアルタイム受信テスト
  it('should receive comments in real-time', () => {
    messagesSubject.next({ content: 'Real-time Comment', timestamp: 123, command: 'red' });
    expect((component as any).comments.length).toBe(1);
    expect((component as any).comments[0].text).toBe('Real-time Comment');
    expect((component as any).comments[0].timestamp).toBe(123);
    expect((component as any).comments[0].fillColor).toBe('#FF0000');
  });
  // 再生数カウントテスト
  it('should count view when video is played', async () => {
    const incrementSpy = vi
      .spyOn(videoService, 'incrementViewCount')
      .mockReturnValue(of({} as any));
    component.initPlyr(document.createElement('video'));
    expect(mockPlayingCallback).not.toBeNull();
    mockPlayingCallback!();
    await vi.advanceTimersByTimeAsync(9999);
    expect(incrementSpy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(incrementSpy).toHaveBeenCalledTimes(1);
    expect(incrementSpy).toHaveBeenCalledWith('ABCD1234');
  });
  it('should cancel view count if video is seeking before 10 seconds', async () => {
    const incrementSpy = vi
      .spyOn(videoService, 'incrementViewCount')
      .mockReturnValue(of({} as any));
    component.initPlyr(document.createElement('video'));
    expect(mockPlayingCallback).not.toBeNull();
    mockPlayingCallback!();
    await vi.advanceTimersByTimeAsync(5000);
    expect(mockSeekingCallback).not.toBeNull();
    mockSeekingCallback!();
    await vi.advanceTimersByTimeAsync(5000);
    expect(incrementSpy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    expect(incrementSpy).not.toHaveBeenCalled();
  });
});
