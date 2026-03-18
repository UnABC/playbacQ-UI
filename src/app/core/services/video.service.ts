import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video, Progress } from '../models/video.model';
import { Tag } from '../models/tag.model';
import { interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private http = inject(HttpClient);
  private readonly apiUrl = '/api/videos';

  getVideos(params: any): Observable<Video[]> {
    return this.http.get<Video[]>(this.apiUrl, { params });
  }

  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`);
  }

  getVideoProgress(id: string): Observable<Progress> {
    // キャッシュを防ぐためにクエリパラメータにタイムスタンプを追加
    return this.http.get<Progress>(`${this.apiUrl}/${id}/progress?t=${new Date().getTime()}`);
  }

  incrementViewCount(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/views`, {});
  }

  createVideo(title: string, description: string): Observable<Video> {
    return this.http.post<Video>(this.apiUrl, { title, description });
  }

  getVideoTags(id: string): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.apiUrl}/${id}/tags`);
  }

  addVideoTag(videoId: string, tagName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${videoId}/tags`, { tag: tagName });
  }

  removeVideoTag(videoId: string, tag: Tag): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${videoId}/tags`, { body: { tag: tag.name } });
  }

  pollUploadProgress(videoId: string, intervalMs: number = 500): Observable<any> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getVideoProgress(videoId)),
      // completedまたはfailedのステータスが返るまでポーリングを続ける
      takeWhile((res) => res.status !== 2 && res.status !== 3, true),
    );
  }
}
