import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StampService } from './stamp.service';
import { Stamp } from '../models/stamp.model';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('StampService', () => {
  let service: StampService;
  let httpTestingController: HttpTestingController;
  const mockStamps: Stamp[] = [
    { id: 'stamp-id-1', name: 'stamp1' },
    { id: 'stamp-id-2', name: 'stamp2' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StampService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StampService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.stamps().size).toBe(0);
  });

  it('should load stamps from API and populate stamps signal', () => {
    service.loadStamps();

    const req = httpTestingController.expectOne('/traq-api/stamps');
    expect(req.request.method).toBe('GET');
    req.flush(mockStamps);

    expect(service.stamps().size).toBe(2);
    expect(service.stamps().get('stamp1')).toBe('stamp-id-1');
    expect(service.stamps().get('stamp2')).toBe('stamp-id-2');
  });

  it('should not send duplicate request if stamps are already loaded', () => {
    service.loadStamps();
    const req = httpTestingController.expectOne('/traq-api/stamps');
    req.flush(mockStamps);

    // Call loadStamps again
    service.loadStamps();
    httpTestingController.expectNone('/traq-api/stamps');
  });

  it('should handle error when loading stamps', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    service.loadStamps();

    const req = httpTestingController.expectOne('/traq-api/stamps');
    req.flush('Failed to fetch', { status: 500, statusText: 'Server Error' });

    expect(service.stamps().size).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should return null from getStampImage when stamps are not loaded', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = service.getStampImage('stamp1');
    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalled();
  });

  it('should return null from getStampImage when stamp is not found', () => {
    service.loadStamps();
    const req = httpTestingController.expectOne('/traq-api/stamps');
    req.flush(mockStamps);

    const result = service.getStampImage('unknown-stamp');
    expect(result).toBeNull();
  });

  it('should create and cache Image element when stamp is found', () => {
    service.loadStamps();
    const req = httpTestingController.expectOne('/traq-api/stamps');
    req.flush(mockStamps);

    const img1 = service.getStampImage('stamp1');
    expect(img1).toBeTruthy();
    expect(img1?.src).toContain('/traq-api/stamps/stamp-id-1/image');

    // Second call should return cached instance
    const img2 = service.getStampImage('stamp1');
    expect(img2).toBe(img1);
  });
});
