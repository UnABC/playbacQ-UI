import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Stamp {
  id: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class StampService {
  private http = inject(HttpClient);
  private readonly traQApiUrl = '/traq-api/stamps';

  private stampSinal = signal<Stamp[]>([]);
  public readonly stamps = this.stampSinal.asReadonly();

  loadStamps() {
    if (this.stampSinal().length > 0) return;

    this.http.get<Stamp[]>(this.traQApiUrl).subscribe({
      next: (stamps) => {
        this.stampSinal.set(stamps);
      },
      error: (err) => {
        console.error('Failed to load stamps:', err);
      },
    });
  }

  loadStampImage(stampId: string): Observable<Blob> {
    return this.http.get(`${this.traQApiUrl}/${stampId}/image`, { responseType: 'blob' });
  }
}
