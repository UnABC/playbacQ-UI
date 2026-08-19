import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Marked, Tokens, TokenizerAndRendererExtension } from 'marked';
import { StampService } from '../../core/services/stamp.service';
import DOMPurify from 'dompurify';

@Pipe({
  name: 'marked',
  standalone: true,
})
export class MarkedPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  private stampService = inject(StampService);
  private markedInstance: Marked;

  constructor() {
    this.markedInstance = new Marked();

    const stampExtension: TokenizerAndRendererExtension = {
      name: 'stamp',
      level: 'inline',
      start(src: string) {
        return src.indexOf(':');
      },
      tokenizer(src: string) {
        const rule = /^:([a-zA-Z0-9_-]+):/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: 'stamp',
            raw: match[0],
            name: match[1],
          };
        }
        return undefined;
      },
      renderer: (token: Tokens.Generic) => {
        const stampId = this.stampService.stamps().get(token['name']);
        if (!stampId) {
          return token.raw;
        }
        const imageUrl = `/traq-api/stamps/${stampId}/image`;
        return `<img src="${imageUrl}" alt="${token['name']}" class="stamp-image" />`;
      },
    };
    this.markedInstance.use({
      extensions: [stampExtension],
      breaks: true,
      gfm: true,
    });
  }

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const rawHtml = this.markedInstance.parse(value) as string;

    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'code', 'pre', 'img', 'span'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    });
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }
}
