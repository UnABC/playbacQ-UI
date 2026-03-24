import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../models/tag.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TagService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl + '/api/tag';

  getTag(query: string): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.apiUrl, { params: { query } });
  }
}
