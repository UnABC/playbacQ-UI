import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VideoService } from './video.service';
import { environment } from '../../../environments/environment';
import { Video } from '../models/video.model';
import { vi } from 'vitest';
import { of } from 'rxjs';

describe('VideoService', () => {
  let service: VideoService;
  let httpTestingController: HttpTestingController;
  let mockVideo: Video;
  const apiUrl = environment.apiUrl + '/api/videos';
  beforeEach(() => {
    mockVideo = {
      video_id: '1',
      title: 'Test Video 1',
      description: 'Description for Test Video 1',
      thumbnail_url: 'http://example.com/thumbnail1.jpg',
      created_at: '2024-01-01T00:00:00Z',
      view_count: 100,
      duration: 120,
      status: 2,
      user_id: 'user123',
      video_url: 'http://example.com/video1.mp4',
      uploadUrl: 'http://example.com/upload/video1.mp4',
      thumbUploadUrl: 'http://example.com/upload/thumbnail1.jpg',
      like_count: 10,
    };
    TestBed.configureTestingModule({
      providers: [VideoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VideoService);
    httpTestingController = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  it('should fetch videos with query parameters', () => {
    const mockVideos: Video[] = [mockVideo];
    service.getVideos({ search: 'Test' }).subscribe((videos) => {
      expect(videos).toEqual(mockVideos);
    });
    const req = httpTestingController.expectOne((request) => {
      return request.url === apiUrl && request.params.get('search') === 'Test';
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockVideos);
  });

  it('should fetch a video by ID', () => {
    service.getVideoById('1').subscribe((video) => {
      expect(video).toEqual(mockVideo);
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockVideo);
  });
  it('should delete a video', () => {
    service.deleteVideo('1').subscribe((response) => {
      expect(response).toEqual({ success: true });
    });
    const req = httpTestingController.expectOne(apiUrl);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ video_id: '1' });
    req.flush({ success: true });
  });
  it('should edit a video', () => {
    const updatedVideo = {
      ...mockVideo,
      title: 'Updated Title',
      description: 'Updated Description',
    };
    service.editVideo('1', 'Updated Title', 'Updated Description').subscribe((video) => {
      expect(video).toEqual(updatedVideo);
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      title: 'Updated Title',
      description: 'Updated Description',
    });
    req.flush(updatedVideo);
  });
  it('should get video progress', () => {
    const mockProgress = { status: 1, progress: 50 };
    service.getVideoProgress('1').subscribe((progress) => {
      expect(progress).toEqual(mockProgress);
    });
    const req = httpTestingController.expectOne((request) => {
      return request.url.startsWith(`${apiUrl}/1/progress`);
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockProgress);
  });
  it('should increment view count', () => {
    service.incrementViewCount('1').subscribe((response) => {
      expect(response).toEqual({ success: true });
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1/views`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });
  it('should create a video', () => {
    const newVideo = { ...mockVideo, video_id: '2', title: 'New Video' };
    service
      .createVideo('New Video', 'Description for New Video', 'video/mp4')
      .subscribe((video) => {
        expect(video).toEqual(newVideo);
      });
    const req = httpTestingController.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'New Video',
      description: 'Description for New Video',
      content_type: 'video/mp4',
    });
    req.flush(newVideo);
  });
  it('should get video tags', () => {
    const mockTags = [
      { tag_id: 1, name: 'Tag1', status: 0 },
      { tag_id: 2, name: 'Tag2', status: 0 },
    ];
    service.getVideoTags('1').subscribe((tags) => {
      expect(tags).toEqual(mockTags);
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1/tags`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTags);
  });
  it('should add a video tag', () => {
    service.addVideoTag('1', 'NewTag').subscribe((response) => {
      expect(response).toEqual({ success: true });
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1/tags`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ tag: 'NewTag' });
    req.flush({ success: true });
  });
  it('should remove a video tag', () => {
    const tagToRemove = { tag_id: 1, name: 'Tag1', status: 0 };
    service.removeVideoTag('1', tagToRemove).subscribe((response) => {
      expect(response).toEqual({ success: true });
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1/tags`);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.body).toEqual({ tag_id: 1 });
    req.flush({ success: true });
  });
  it('should poll upload progress until completion', async () => {
    const mockProgressInProgress = { status: 1, progress: 50 };
    const mockProgressCompleted = { status: 2, progress: 100 };
    const getVideoProgressSpy = vi
      .spyOn(service, 'getVideoProgress')
      .mockReturnValueOnce(of(mockProgressInProgress))
      .mockReturnValueOnce(of(mockProgressCompleted));
    const progressValues: any[] = [];
    service.pollUploadProgress('1', 1000).subscribe((progress) => {
      progressValues.push(progress);
    });
    vi.advanceTimersByTime(1000);
    expect(getVideoProgressSpy).toHaveBeenCalledTimes(1);
    expect(getVideoProgressSpy).toHaveBeenCalledWith('1');
    vi.advanceTimersByTime(1000);
    expect(getVideoProgressSpy).toHaveBeenCalledTimes(2);
    expect(getVideoProgressSpy).toHaveBeenCalledWith('1');
    expect(progressValues).toEqual([mockProgressInProgress, mockProgressCompleted]);
  });
  it('should get likes for a video', () => {
    const mockLikes = ['user1', 'user2'];
    service.getLikes('1').subscribe((likes) => {
      expect(likes).toEqual(mockLikes);
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1/likes`);
    expect(req.request.method).toBe('GET');
    req.flush(mockLikes);
  });
  it('should add a like to a video', () => {
    service.addLike('1').subscribe((response) => {
      expect(response).toEqual({ success: true });
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1/likes`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true });
  });
  it('should remove a like from a video', () => {
    service.removeLike('1').subscribe((response) => {
      expect(response).toEqual({ success: true });
    });
    const req = httpTestingController.expectOne(`${apiUrl}/1/likes`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });
});
