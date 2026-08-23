import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Stamp } from '../models/stamp.model';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { StampFrame, AnimatedStampData } from '../models/stamp.model';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StampService {
  private http = inject(HttpClient);
  private readonly traQApiUrl = '/traq-api/stamps';

  private stampSinal = signal<Map<string, string>>(new Map());
  private stampCache = new Map<string, AnimatedStampData>();
  private loadStamps$?: Observable<Map<string, string>>;

  loadStamps() {
    if (this.stampSinal().size > 0) return of(this.stampSinal());
    if (this.loadStamps$) return this.loadStamps$;

    this.loadStamps$ = this.http.get<Stamp[]>(this.traQApiUrl).pipe(
      map((stamps) => {
        const stampMap = new Map<string, string>();
        stamps.forEach((stamp) => {
          stampMap.set(stamp.name, stamp.id);
        });
        this.stampSinal.set(stampMap);
        return stampMap;
      }),
      catchError((err) => {
        console.error('Failed to load stamps:', err);
        return of(new Map<string, string>());
      }),
      shareReplay(1),
    );
    return this.loadStamps$;
  }

  getStamps(): string[] {
    return Array.from(this.stampSinal().keys());
  }

  getStampImage(stampName: string): AnimatedStampData | null {
    const stampId = this.stampSinal().get(stampName);
    if (!stampId) return null;

    if (this.stampCache.has(stampId)) {
      return this.stampCache.get(stampId)!;
    }

    const cacheEntry: AnimatedStampData = { isAnimated: false };
    this.stampCache.set(stampId, cacheEntry);

    this.http
      .get(`${this.traQApiUrl}/${stampId}/image`, { responseType: 'arraybuffer' })
      .subscribe({
        next: async (buffer) => {
          try {
            const gif = parseGIF(buffer);
            const frames = decompressFrames(gif, true);

            // アニメーションGIF
            if (frames.length > 1) {
              const stampFrames: StampFrame[] = [];
              let totalDuration = 0;

              for (const frame of frames) {
                const imageData = new ImageData(
                  new Uint8ClampedArray(frame.patch),
                  frame.dims.width,
                  frame.dims.height,
                );
                const bitmap = await createImageBitmap(imageData);
                const delay = frame.delay || 200;
                stampFrames.push({ bitmap, delay });
                totalDuration += delay;
              }
              cacheEntry.isAnimated = true;
              cacheEntry.frames = stampFrames;
              cacheEntry.totalDuration = totalDuration;
            } else {
              // 静止画
              this.loadStaticImage(stampId, cacheEntry);
            }
          } catch {
            // 静止画
            this.loadStaticImage(stampId, cacheEntry);
          }
        },
        error: () => {
          // 静止画
          this.loadStaticImage(stampId, cacheEntry);
        },
      });
    return cacheEntry;
  }

  getStampURL(stampName: string): string | null {
    const stampId = this.stampSinal().get(stampName);
    if (!stampId) return null;
    return `${this.traQApiUrl}/${stampId}/image`;
  }

  private loadStaticImage(stampId: string, cacheEntry: AnimatedStampData) {
    const img = new Image();
    img.src = `${this.traQApiUrl}/${stampId}/image`;
    cacheEntry.isAnimated = false;
    cacheEntry.staticImage = img;
  }
}
