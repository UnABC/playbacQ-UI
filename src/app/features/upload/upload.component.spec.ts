import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadComponent } from './upload.component';
import { VideoService } from '../../core/services/video.service';
import { UploadService } from '../../core/services/upload.service';
import { vi } from 'vitest';
import { of, Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { HttpResponse, HttpEventType } from '@angular/common/http';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let videoService: VideoService;
  let uploadService: UploadService;
  beforeEach(async () => {
    const mockVideoService = {
      createVideo: vi.fn(),
      pollUploadProgress: vi.fn(),
    };
    const mockUploadService = {
      uploadToMinio: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [UploadComponent],
      providers: [
        { provide: VideoService, useValue: mockVideoService },
        { provide: UploadService, useValue: mockUploadService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    videoService = TestBed.inject(VideoService);
    uploadService = TestBed.inject(UploadService);
    vi.useFakeTimers();
    fixture.detectChanges();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('Form test', () => {
    // 初期状態ではフォームは無効(空)であることを確認
    expect(component.videoForm.valid).not.toBeTruthy();
    // タイトルを入力してフォームが有効になることを確認
    component.videoForm.controls['title'].setValue('Test Video');
    expect(component.videoForm.valid).toBeTruthy();
    // タイトルが空の状態で投稿できないことを確認
    const createVideoSpy = vi.spyOn(videoService, 'createVideo');
    component.videoForm.controls['title'].setValue('');
    component.startUpload();
    expect(createVideoSpy).not.toHaveBeenCalled();
  });
  it('DOM UI test', () => {
    const mockDragEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;
    component.onDragOver(mockDragEvent);
    expect(component.isDragging).toBe(true);
    expect(mockDragEvent.preventDefault).toHaveBeenCalled();
    expect(mockDragEvent.stopPropagation).toHaveBeenCalled();
  });
  it('Pass the file to the service test', () => {
    const mockVideoFile = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    const mockDropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [mockVideoFile],
      },
    } as unknown as DragEvent;
    component.onDrop(mockDropEvent);
    expect(component.selectedFile).toBe(mockVideoFile);
    expect(component.hasFile).toBe(true);
  });
  it('Pass invalid file test', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const mockImageFile = new File(['dummy content'], 'test.png', { type: 'image/png' });
    (component as any).handleFile(mockImageFile);
    expect(alertSpy).toHaveBeenCalledWith('動画ファイルを選択してください。');
    expect(component.selectedFile).toBeNull();
    alertSpy.mockRestore();
  });
  it('Process video test', async () => {
    component.videoForm.controls.title.setValue('Test Video');
    component.videoForm.controls.description.setValue('Test Description');
    component.selectedFile = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });

    const mockResponse = {
      uploadUrl: 'http://dummy.url',
      video_id: 'ABCD1234',
      user_id: 'user1',
      title: 'Test Video',
      description: 'Test Description',
      video_url: 'http://example.com/video.mp4',
    } as any;
    const createVideoSpy = vi.spyOn(videoService, 'createVideo').mockReturnValue(of(mockResponse));
    vi.spyOn(uploadService, 'uploadToMinio').mockReturnValue(of(new HttpResponse({ status: 200 })));
    vi.spyOn(videoService, 'pollUploadProgress').mockReturnValue(of({ status: 2, progress: 100 }));
    component.startUpload();
    await vi.runAllTimersAsync();
    expect(createVideoSpy).toHaveBeenCalledWith('Test Video', 'Test Description');
  });
  it('Progress polling test', async () => {
    component.videoForm.controls.title.setValue('Test Video');
    component.videoForm.controls.description.setValue('Test Description');
    component.selectedFile = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });

    const mockUploadSubject = new Subject<any>();

    const mockResponse = {
      uploadUrl: 'http://dummy.url',
      video_id: 'ABCD1234',
      user_id: 'user1',
      title: 'Test Video',
      description: 'Test Description',
      video_url: 'http://example.com/video.mp4',
    } as any;
    vi.spyOn(videoService, 'createVideo').mockReturnValue(of(mockResponse));
    vi.spyOn(uploadService, 'uploadToMinio').mockReturnValue(mockUploadSubject.asObservable());
    vi.spyOn(videoService, 'pollUploadProgress').mockReturnValue(of({ status: 2, progress: 100 }));

    component.startUpload();
    await vi.runAllTimersAsync();

    mockUploadSubject.next({
      type: HttpEventType.UploadProgress,
      loaded: 128,
      total: 512,
    });
    expect(component.uploadProgress).toBe(25);
    mockUploadSubject.next({ type: HttpEventType.Response });
    mockUploadSubject.complete();
  });
  // HTML側のテスト
  it('upload button should be disabled when form is invalid', () => {
    const uploadButtonElement = fixture.debugElement.query(By.css('button[color="primary"]'))
      .nativeElement as HTMLButtonElement;
    expect(uploadButtonElement.disabled).toBeTruthy();
    component.videoForm.controls['title'].setValue('Test Video');
    fixture.detectChanges();
    expect(uploadButtonElement.disabled).toBeFalsy();
  });
  it('Display uploaded file name', () => {
    const mockVideoFile = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    component.selectedFile = mockVideoFile;
    fixture.detectChanges();
    const dropZoneElement = fixture.debugElement.query(By.css('.drop-zone')).nativeElement;
    expect(dropZoneElement.textContent).toContain('test.mp4');
  });
  it('detects select file button click and opens file dialog', () => {
    const fileInput = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
    const selectButton = fixture.debugElement.query(
      By.css('button[matButton="elevated"]'),
    ).nativeElement;
    const inputClickSpy = vi.spyOn(fileInput, 'click');
    selectButton.click();
    expect(inputClickSpy).toHaveBeenCalled();
  });
  it('step to next after file selection', async () => {
    const mockVideoFile = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    const fileInput = fixture.debugElement.query(By.css('input[type="file"]')).nativeElement;
    const changeEvent = new Event('change');
    Object.defineProperty(changeEvent, 'target', { value: { files: [mockVideoFile] } });
    fileInput.dispatchEvent(changeEvent);
    fixture.detectChanges();
    expect(component.selectedFile).toBe(mockVideoFile);
    expect(component.hasFile).toBe(true);
    // ステップが次に進んでいることを確認
    await vi.runAllTimersAsync();
    expect((component as any).stepper.selectedIndex).toBe(1);
  });
  // Step 2 -> Step 3
  it('after pushed button, step to next', async () => {
    component.videoForm.controls.title.setValue('Test Video');
    component.videoForm.controls.description.setValue('Test Description');
    component.selectedFile = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    (component as any).handleFile(component.selectedFile);
    await vi.runAllTimersAsync();
    fixture.detectChanges();

    const uploadButton = fixture.debugElement.query(
      By.css('button[color="primary"]'),
    ).nativeElement;
    const mockResponse = {
      uploadUrl: 'http://dummy.url',
      video_id: 'ABCD1234',
      user_id: 'user1',
      title: 'Test Video',
      description: 'Test Description',
      video_url: 'http://example.com/video.mp4',
    } as any;
    vi.spyOn(videoService, 'createVideo').mockReturnValue(of(mockResponse));
    vi.spyOn(uploadService, 'uploadToMinio').mockReturnValue(of(new HttpResponse({ status: 200 })));
    vi.spyOn(videoService, 'pollUploadProgress').mockReturnValue(of({ status: 1, progress: 50 }));
    uploadButton.click();
    await vi.runAllTimersAsync();
    expect((component as any).stepper.selectedIndex).toBe(2);
  });
  // Step 3 -> Step 4
  it('after upload complete, step to next', async () => {
    component.videoForm.controls.title.setValue('Test Video');
    component.videoForm.controls.description.setValue('Test Description');
    const mockFile = new File(['dummy content'], 'test.mp4', { type: 'video/mp4' });
    (component as any).handleFile(mockFile);
    await vi.runAllTimersAsync();
    fixture.detectChanges();
	expect((component as any).stepper.selectedIndex).toBe(1);

    const mockResponse = {
      uploadUrl: 'http://dummy.url',
      video_id: 'ABCD1234',
      user_id: 'user1',
      title: 'Test Video',
      description: 'Test Description',
      video_url: 'http://example.com/video.mp4',
    } as any;
    vi.spyOn(videoService, 'createVideo').mockReturnValue(of(mockResponse));
    vi.spyOn(uploadService, 'uploadToMinio').mockReturnValue(of(new HttpResponse({ status: 200 })));
    vi.spyOn(videoService, 'pollUploadProgress').mockReturnValue(of({ status: 2, progress: 100 }));
    const uploadButton = fixture.debugElement.query(
      By.css('button[color="primary"]'),
    ).nativeElement;
    uploadButton.click();

    await vi.runAllTimersAsync();
    fixture.detectChanges();
    expect((component as any).stepper.selectedIndex).toBe(3);
  });
});
