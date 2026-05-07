import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = 'https://q.trap.jp/api/v3/public/icon/';

  getUserIcon(userId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}${userId}`, { responseType: 'blob' });
  }
}
