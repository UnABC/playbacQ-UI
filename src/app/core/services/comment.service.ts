import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private http = inject(HttpClient);

  postComment(
    videoId: string,
    content: string,
    timestamp: number,
    command: string,
  ): Observable<any> {
    return this.http.post(`/api/videos/${videoId}/comments`, { content, timestamp, command });
  }
}
