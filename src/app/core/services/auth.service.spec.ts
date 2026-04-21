import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;
  const apiUrl = environment.apiUrl + '/api/auth';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch user ID', () => {
    const mockResponse = { userId: 'test-user-id' };
    service.getUserID().subscribe((response) => {
      expect(response).toEqual(mockResponse);
    });
    const req = httpTestingController.expectOne(`${apiUrl}/user`);
    req.flush(mockResponse);
  });
});
