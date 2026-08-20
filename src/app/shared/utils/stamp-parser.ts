import { AnimatedStampData } from '../../core/models/stamp.model';

export type CommentSegment =
  | { type: 'text'; text: string }
  | { type: 'stamp'; name: string; stampData?: AnimatedStampData | null };
const STAMP_REGEX = /:([a-zA-Z0-9_\-]+):/g;

export function parseComment(
  comment: string,
  getStampData: (name: string) => AnimatedStampData | null,
): CommentSegment[] {
  if (!comment) return [];

  const segments: CommentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  STAMP_REGEX.lastIndex = 0;
  while ((match = STAMP_REGEX.exec(comment)) !== null) {
    // スタンプの前のテキスト部分
    if (match.index > lastIndex) {
      segments.push({ type: 'text', text: comment.slice(lastIndex, match.index) });
    }
    const stampName = match[1];
    const stampData = getStampData(stampName);
    if (stampData) {
      segments.push({ type: 'stamp', name: stampName, stampData });
    } else {
      // スタンプが見つからない場合は、元のテキストとして扱う
      segments.push({ type: 'text', text: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }
  // 残りのテキスト部分
  if (lastIndex < comment.length) {
    segments.push({ type: 'text', text: comment.slice(lastIndex) });
  }
  return segments;
}
