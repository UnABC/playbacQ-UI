import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TagService } from './tag.service';
import { environment } from '../../../environments/environment';
import { Tag } from '../models/tag.model';

describe('TagService', () => {
  let service: TagService;
  let httpTestingController: HttpTestingController;
  const apiUrl = environment.apiUrl + '/api/tag';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TagService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TagService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch tags based on query', () => {
    const mockTags: Tag[] = [
      { tag_id: 1, name: 'test', status: 0 },
      { tag_id: 2, name: 'example', status: 0 },
    ];
    service.getTag('te').subscribe((tags) => {
      expect(tags).toEqual(mockTags);
    });

    const req = httpTestingController.expectOne(`${apiUrl}?query=te`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTags);
  });
});
