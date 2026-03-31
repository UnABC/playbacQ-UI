import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Subject, Observable } from 'rxjs';
import { Comment } from '../models/video.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private http = inject(HttpClient);

  private socket$: WebSocketSubject<any> | null = null;
  private messagesSubject = new Subject<any>();
  public messages$: Observable<any> = this.messagesSubject.asObservable();

  connect(videoId: string): void {
    if (this.socket$) return;
    const wsUrl = `${environment.wsUrl}/ws/comments?video_id=${videoId}`;

    this.socket$ = webSocket(wsUrl);

    this.socket$.subscribe({
      next: (msg) => {
        // バックエンドからデータが来たら、ストリーム(messages$)に流す
        this.messagesSubject.next(msg);
      },
      error: (err) => {
        console.error('WebSocket Error:', err);
        // TODO:必要に応じて再接続ロジックなどをここに書く
      },
      complete: () => {
        console.log('WebSocket Connection Closed');
        this.socket$ = null;
      },
    });
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }

  getComments(videoId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${environment.apiUrl}/api/videos/${videoId}/comments`);
  }

  postComment(
    videoId: string,
    content: string,
    timestamp: number,
    command: string,
  ): Observable<any> {
    return this.http.post(`${environment.apiUrl}/api/videos/${videoId}/comments`, {
      content,
      timestamp,
      command,
    });
  }
}
