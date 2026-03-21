import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PlayerComponent } from './player.component';
import { TagService } from '../../core/services/tag.service';
import { VideoService } from '../../core/services/video.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('PlayerComponent', () => {
  let component: PlayerComponent;
  let fixture: ComponentFixture<PlayerComponent>;
  let tagService: TagService;
  let videoService: VideoService;
  beforeEach(async () => {
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
        }),
      ),
      removeVideoTag: vi.fn().mockReturnValue(of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [PlayerComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TagService, useValue: mockTagService },
        { provide: VideoService, useValue: mockVideoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerComponent);
    component = fixture.componentInstance;
    videoService = TestBed.inject(VideoService);
    component.videoMetadata = {
      video_id: 'ABCD1234',
      title: 'Test Video',
      user_id: 'user',
      description: 'A test video',
    } as any;
    tagService = TestBed.inject(TagService);
    vi.useFakeTimers();
    fixture.detectChanges();
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
});
