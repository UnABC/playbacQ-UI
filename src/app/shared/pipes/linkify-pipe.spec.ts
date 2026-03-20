import { TestBed } from '@angular/core/testing';
import { LinkifyPipe } from './linkify-pipe';

describe('LinkifyPipe', () => {
  let pipe: LinkifyPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LinkifyPipe],
    });
    pipe = TestBed.inject(LinkifyPipe);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });
});
