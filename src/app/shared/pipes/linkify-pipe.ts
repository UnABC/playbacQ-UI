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
    // URLを検出してリンク化
    const urlRegex = /(https?:\/\/[a-zA-Z0-9\-\.\/\?\,\=\&\#\%\~\+\_]+)/g;
    const linkedText = text.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="custom-link">$1</a>',
    );
    // Angularの標準機能でテキストをサニタイズ
    const sanitizedText = this.sanitizer.sanitize(SecurityContext.HTML, linkedText) || '';

    return this.sanitizer.bypassSecurityTrustHtml(sanitizedText);
  }
}
