import { Pipe, PipeTransform, inject, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'linkify',
  standalone: true,
})
export class LinkifyPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(text: string | undefined): SafeHtml {
    if (!text) return '';
    // Angularの標準機能でテキストをサニタイズ
    const sanitizedText = this.sanitizer.sanitize(SecurityContext.HTML, text) || '';
    // URLを検出してリンク化
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const linkedText = sanitizedText.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="custom-link">$1</a>',
    );

    return this.sanitizer.bypassSecurityTrustHtml(linkedText);
  }
}
