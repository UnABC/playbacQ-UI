import { TestBed } from '@angular/core/testing';
import { SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
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

  it('should linkify URLs in the text', () => {
    const input = 'Check out https://example.com and http://test.com';
    const result = pipe.transform(input);
    const sanitizer = TestBed.inject(DomSanitizer);
    const html = sanitizer.sanitize(SecurityContext.HTML, result) || '';

    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain('<a href="http://test.com"');
  });

  it('should return empty string for undefined input', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should sanitize potentially dangerous input', () => {
    const input = 'Click <script>alert("XSS")</script> https://example.com';
    const result = pipe.transform(input);
    const sanitizer = TestBed.inject(DomSanitizer);
    const html = sanitizer.sanitize(SecurityContext.HTML, result) || '';
    expect(html).not.toContain('<script>');
    expect(html).toContain('<a href="https://example.com"');
  });

  it('should empty for completely dangerous input', () => {
    const input = '<script>alert("XSS")</script>';
    const result = pipe.transform(input);
    const sanitizer = TestBed.inject(DomSanitizer);
    const html = sanitizer.sanitize(SecurityContext.HTML, result) || '';
    expect(html).toBe('');
  });
});
