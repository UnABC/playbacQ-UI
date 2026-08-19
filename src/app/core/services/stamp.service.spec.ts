import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StampService } from './stamp.service';

describe('StampService', () => {
  let service: StampService;
  let httpTestingController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StampService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StampService);
    httpTestingController = TestBed.inject(HttpTestingController);
	// TODO: make mock API response for stamps
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  // TODO: write tests
});
