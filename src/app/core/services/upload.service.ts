import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private http = inject(HttpClient);

  uploadToMinio(presignedUrl: string, file: File): Observable<HttpEvent<any>> {
    const headers = new HttpHeaders({
      'Content-Type': file.type,
    });
    const req = new HttpRequest('PUT', presignedUrl, file, {
      reportProgress: true,
      headers: headers,
    });
    return this.http.request(req);
  }
}
