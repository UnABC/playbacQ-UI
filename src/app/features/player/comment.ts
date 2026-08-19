import { parseComment, CommentSegment } from '../../shared/utils/stamp-parser';
import { StampService } from '../../core/services/stamp.service';

export class Comment {
  private duration: number;
  private font = '';
  private text: string;
  private fillColor: string;
  private strokeColor: string;
  private speed: number;
  private textXsize: number = 0;
  private commentSegments: CommentSegment[];
  private fontSize: number = 34;
  position: 'ue' | 'naka' | 'shita' = 'naka';
  height: number;
  y: number;
  timestamp: number;
  appearTime: number;

  constructor(
    text: string = '',
    timestamp: number = 0,
    command: string = '',
    private stampService?: StampService,
  ) {
    this.timestamp = timestamp;
    this.text = text;
    this.y = 4;
    // 参考：3文字=約480px/s
    this.speed = 480;
    this.duration = 4000; // コメントが画面を横切るのにかかる時間（ms）
    this.font = 'bold 36px sans-serif';
    this.fillColor = '#ffffff';
    this.strokeColor = '#000000';

    const commentLineLength = text.split('\n').length;
    const cmds = command.toLowerCase().split(/\s+/);
    let fontName = 'sans-serif';
    for (const cmd of cmds) {
      switch (cmd) {
        // size
        case 'big':
          if (commentLineLength < 3) this.fontSize = 45 * commentLineLength + 5;
          else this.fontSize = 24 * commentLineLength + 3;
          break;
        case 'medium':
          if (commentLineLength < 5) this.fontSize = 29 * commentLineLength + 5;
          else this.fontSize = 15 * commentLineLength + 3;
          break;
        case 'small':
          if (commentLineLength < 7) this.fontSize = 18 * commentLineLength + 5;
          else this.fontSize = 10 * commentLineLength + 3;
          break;
        // font
        case 'gothic':
          fontName = 'sans-serif';
          break;
        case 'mincho':
          fontName = 'serif';
          break;
        // position
        case 'ue':
          this.position = 'ue';
          break;
        case 'naka':
          this.position = 'naka';
          break;
        case 'shita':
          this.position = 'shita';
          break;
        // color
        case 'white':
          this.fillColor = '#ffffff';
          break;
        case 'black':
          this.fillColor = '#000000';
          this.strokeColor = '#ffffff';
          break;
        case 'gray':
          this.fillColor = '#808080';
          break;
        case 'brown':
          this.fillColor = '#01407F';
          break;
        case 'green':
          this.fillColor = '#238F23';
          break;
        case 'cyan':
          this.fillColor = '#B2ECED';
          break;
        case 'blue':
          this.fillColor = '#0000FF';
          break;
        case 'yellow':
          this.fillColor = '#FFFF00';
          break;
        case 'orange':
          this.fillColor = '#FF8000';
          break;
        case 'red':
          this.fillColor = '#FF0000';
          break;
        // カラーコードでの指定の場合
        default:
          if (/^#([0-9A-F]{3}){1,2}$/i.test(cmd)) {
            this.fillColor = cmd;
          }
      }
    }
    this.fontSize *= 2.3;
    this.fontSize = Math.round(this.fontSize);
    this.font = `bold ${this.fontSize}px ${fontName}`;
    this.height = this.fontSize * commentLineLength;
    // パース
    if (this.stampService && this.stampService.stamps().size > 0) {
      this.commentSegments = parseComment(text, (name) => this.stampService!.getStampImage(name));
    } else {
      this.commentSegments = [{ type: 'text', text }];
    }
    // 文字数に応じて横幅を計算
    let textLength = 0;
    for (const segment of this.commentSegments) {
      if (segment.type === 'text') {
        textLength += segment.text.length;
      } else if (segment.type === 'stamp') {
        textLength += 1.2; // スタンプは文字数換算で1.2文字分とする
      }
    }

    this.textXsize = Math.round(this.fontSize * textLength);
    if (this.position === 'naka') {
      // 文字数に応じて速度を調整
      this.speed = 372 + textLength * 36;
      // 2文字分空白を入れる
      this.appearTime = (this.textXsize + this.fontSize * 2) / this.speed;
      this.duration = (1920 + this.textXsize) / this.speed;
    } else {
      this.speed = 0;
      this.appearTime = 3.0;
      this.duration = 3.0;
    }
  }

  draw(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (currentTime < this.timestamp || currentTime > this.timestamp + this.duration) {
      return;
    }
    const elapsed = currentTime - this.timestamp;
    const currentX =
      this.position === 'naka' ? 1920 - this.speed * elapsed : (1920 - this.textXsize) / 2;
    ctx.font = this.font;
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = 4;
    ctx.textBaseline = 'top';

    let drawX = currentX;
    const stampSize = this.fontSize;

    for (const segment of this.commentSegments) {
      if (segment.type === 'text') {
        ctx.strokeText(segment.text, drawX, this.y);
        ctx.fillText(segment.text, drawX, this.y);
        drawX += ctx.measureText(segment.text).width;
      } else if (segment.type === 'stamp') {
        const img = segment.image;
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, drawX, this.y, stampSize, stampSize);
          drawX += stampSize;
        } else {
          // 画像がまだ読み込まれていない場合は、プレースホルダーを描画する
          ctx.fillStyle = '#cccccc';
          ctx.fillRect(drawX, this.y, stampSize, stampSize);
          drawX += stampSize;
        }
      }
    }
  }
}
