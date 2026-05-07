import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;
  const apiUrl = 'https://q.trap.jp/api/v3/public/icon';
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch user icon', () => {
    const mockBlob = new Blob(['mock image data'], { type: 'image/png' });
    service.getUserIcon('test').subscribe((iconBlob) => {
      expect(iconBlob).toEqual(mockBlob);
    });
    const req = httpTestingController.expectOne(`${apiUrl}/test`);
    expect(req.request.method).toBe('GET');
    req.flush(mockBlob);
  });
});
