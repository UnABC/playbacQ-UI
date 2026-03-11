import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private http = inject(HttpClient);

  uploadToMinio(presignedUrl: string, file: File): Observable<HttpEvent<any>> {
    return this.http.put(presignedUrl, file, {
      headers: {
        'Content-Type': 'video/mp4',
      },
      reportProgress: true,
      observe: 'events',
    });
  }
}
