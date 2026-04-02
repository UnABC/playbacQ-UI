import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/auth';

  getUserID(): Observable<{ userId: string } | null> {
    return this.http.get<{ userId: string }>(`${this.apiUrl}/user`);
  }
}
