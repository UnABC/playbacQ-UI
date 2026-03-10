import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Video, Progress } from '../models/video.model';
import { interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class VideoService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/videos';

  getVideos(params: any): Observable<Video[]> {
    return this.http.get<Video[]>(this.apiUrl, { params });
  }

  getVideoById(id: string): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/${id}`);
  }

  getVideoProgress(id: string): Observable<Progress> {
    return this.http.get<Progress>(`${this.apiUrl}/${id}/progress`);
  }

  createVideo(title: string, description: string): Observable<Video> {
    return this.http.post<Video>(this.apiUrl, { title, description });
  }

  pollUploadProgress(videoId: string, intervalMs: number = 2000): Observable<any> {
    return interval(intervalMs).pipe(
      switchMap(() => this.getVideoProgress(videoId)),
      takeWhile((res) => res.status !== 'completed' && res.status !== 'failed', true),
    );
  }
}
