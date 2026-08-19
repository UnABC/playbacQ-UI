import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Stamp } from '../models/stamp.model';

@Injectable({
  providedIn: 'root',
})
export class StampService {
  private http = inject(HttpClient);
  private readonly traQApiUrl = '/traq-api/stamps';

  private stampSinal = signal<Map<string, string>>(new Map());
  public readonly stamps = this.stampSinal.asReadonly();
  private imageCache = new Map<string, HTMLImageElement>();

  loadStamps() {
    if (this.stampSinal().size > 0) return;

    this.http.get<Stamp[]>(this.traQApiUrl).subscribe({
      next: (stamps) => {
        const stampMap = new Map<string, string>();
        stamps.forEach((stamp) => {
          stampMap.set(stamp.name, stamp.id);
        });
        this.stampSinal.set(stampMap);
      },
      error: (err) => {
        console.error('Failed to load stamps:', err);
      },
    });
  }

  getStampImage(stampName: string): HTMLImageElement | null {
    if (this.stampSinal().size === 0) {
      console.warn('StampService: Stamps have not been loaded yet. Call loadStamps() first.');
      return null;
    }
    const stampId = this.stampSinal().get(stampName);
    if (!stampId) return null;

    if (this.imageCache.has(stampId)) {
      return this.imageCache.get(stampId)!;
    }
    console.log(`Loading image for stamp: ${stampName} (ID: ${stampId})`);
    const image = new Image();
    image.src = `${this.traQApiUrl}/${stampId}/image`;
    this.imageCache.set(stampId, image);
    return image;
  }
}
