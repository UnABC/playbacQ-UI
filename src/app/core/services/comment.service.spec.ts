import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CommentService } from './comment.service';
import { environment } from '../../../environments/environment';
import { Comment } from '../models/video.model';
import { Subject } from 'rxjs';
import * as rxjsWebSocket from 'rxjs/webSocket';
import { vi } from 'vitest';

describe('CommentService', () => {
  let service: CommentService;
  let httpTestingController: HttpTestingController;
  const apiUrl = environment.apiUrl + '/api/videos';

  beforeEach(() => {
    const mockWebSocket = {
      subscribe: () => ({ unsubscribe: () => {} }),
    };
    vi.spyOn(window, 'WebSocket').mockReturnValue(mockWebSocket as any);
    TestBed.configureTestingModule({
      providers: [CommentService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CommentService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch comments for a video', () => {
    const mockComments: Comment[] = [
      {
        comment_id: 1,
        comment: 'Great video!',
        created_at: '2024-01-01T00:00:00Z',
        timestamp: 1000,
        command: 'red',
        user_id: 'user123',
        video_id: 'video123',
      },
    ];
    service.getComments('video123').subscribe((comments) => {
      expect(comments).toEqual(mockComments);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/video123/comments`);
    expect(req.request.method).toBe('GET');
    req.flush(mockComments);
  });

  it('should fetch comments for an embedded video', () => {
    const mockComments: Comment[] = [
      {
        comment_id: 1,
        comment: 'Great video!',
        created_at: '2024-01-01T00:00:00Z',
        timestamp: 1000,
        command: 'red',
        user_id: 'user123',
        video_id: 'video123',
      },
    ];
    service.getEmbedComments('video123', 'token123').subscribe((comments) => {
      expect(comments).toEqual(mockComments);
    });

    const req = httpTestingController.expectOne(
      `${environment.apiUrl}/api/embed/video123/comments?token=token123`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockComments);
  });

  it('should post a comment to a video', () => {
    const mockResponse = { success: true };
    service.postComment('video123', 'Nice video!', 2000, 'blue').subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpTestingController.expectOne(`${apiUrl}/video123/comments`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      content: 'Nice video!',
      timestamp: 2000,
      command: 'blue',
    });
    req.flush(mockResponse);
  });
  // WebSocketのテスト
  it('should early return if already connected', () => {
    service.connect('video123');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    service.connect('video123'); // 2回目の接続は無視されるべき
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
  it('should handle WebSocket messages', () => {
    const messageSubject = new Subject<any>();
    const mockWebSocketSubject = {
      subscribe: (observer: any) => {
        return messageSubject.subscribe(observer);
      },
      complete: () => messageSubject.complete(),
    };
    vi.spyOn(rxjsWebSocket, 'webSocket').mockReturnValue(mockWebSocketSubject as any);
    service.connect('video123');
    const testMessage = { comment: 'Test comment' };
    let receivedMessage: any;
    service.messages$.subscribe((msg) => (receivedMessage = msg));
    messageSubject.next(testMessage);
    expect(receivedMessage).toEqual(testMessage);
  });
  it('should close WebSocket when complete is called', () => {
    const completeSpy = vi.fn();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    let observerRef: any;
    const mockWebSocketSubject = {
      subscribe: (observer: any) => {
        observerRef = observer;
        return { unsubscribe: () => {} };
      },
      complete: function () {
        completeSpy();
        observerRef?.complete?.();
      },
    } as any;
    vi.spyOn(rxjsWebSocket, 'webSocket').mockReturnValue(mockWebSocketSubject);
    service.connect('video123');
    service.disconnect();
    expect(completeSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('WebSocket Connection Closed');
    expect(service['socket$']).toBeNull();
  });
  it('should handle WebSocket errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockWebSocketSubject = {
      subscribe: (observer: any) => {
        observer.error(new Error('WebSocket error'));
        return { unsubscribe: () => {} };
      },
      complete: () => {},
    } as any;
    vi.spyOn(rxjsWebSocket, 'webSocket').mockReturnValue(mockWebSocketSubject);
    service.connect('video123');
    expect(errorSpy).toHaveBeenCalledWith('WebSocket Error:', expect.any(Error));
  });
  it('should disconnect WebSocket when disconnect is called', () => {
    const completeSpy = vi.fn();
    const mockWebSocketSubject = {
      subscribe: (observer: any) => {
        return { unsubscribe: completeSpy };
      },
      complete: completeSpy,
    } as any;
    vi.spyOn(rxjsWebSocket, 'webSocket').mockReturnValue(mockWebSocketSubject);
    service.connect('video123');
    service.disconnect();
    expect(completeSpy).toHaveBeenCalled();
    expect(service['socket$']).toBeNull();
  });
  it('should not attempt to disconnect if socket is already null', () => {
    const completeSpy = vi.fn();
    service.disconnect();
    expect(completeSpy).not.toHaveBeenCalled();
  });
});
