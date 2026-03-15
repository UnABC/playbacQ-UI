export class Comment {
  private y: number;
  private font = '';
  private text: string;
  private fillColor: string;
  private strokeColor: string;
  private speed: number;
  private duration: number;
  private textXsize: number = 0;
  private position: 'ue' | 'naka' | 'shita' = 'naka';
  timestamp: number;

  constructor(text: string, timestamp: number, command: string) {
    this.timestamp = timestamp;
    this.text = text;
    this.y = Math.random() * 800;
    // 参考：3文字=約480px/s
    this.speed = 480;
    this.duration = 4000; // コメントが画面を横切るのにかかる時間（ms）
    this.font = 'bold 36px sans-serif';
    this.fillColor = '#ffffff';
    this.strokeColor = '#000000';

    const commentLineLength = text.split('\n').length;
    const cmds = command.toLowerCase().split(/\s+/);
    let fontSize = 34;
    let fontName = 'sans-serif';
    for (const cmd of cmds) {
      switch (cmd) {
        // size
        case 'big':
          if (commentLineLength < 3) fontSize = 45 * commentLineLength + 5;
          else fontSize = 24 * commentLineLength + 3;
          break;
        case 'medium':
          if (commentLineLength < 5) fontSize = 29 * commentLineLength + 5;
          else fontSize = 15 * commentLineLength + 3;
          break;
        case 'small':
          if (commentLineLength < 7) fontSize = 18 * commentLineLength + 5;
          else fontSize = 10 * commentLineLength + 3;
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
    fontSize *= 2.3;
    this.textXsize = fontSize * text.length;
    this.font = `bold ${fontSize}px ${fontName}`;
    this.y = this.decideY(this.position);
    // 文字数に応じて速度を調整
    this.speed = 372 + text.length * 36;
    this.duration = (1920 + this.textXsize) / this.speed;
  }

  draw(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (currentTime < this.timestamp || currentTime > this.timestamp + this.duration) {
      return;
    }
    const elapsed = currentTime - this.timestamp;
    const currentX = 1920 - this.speed * elapsed;
    ctx.font = this.font;
    ctx.fillStyle = this.fillColor;
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = 4;
    ctx.textBaseline = 'top';

    ctx.strokeText(this.text, currentX, this.y);
    ctx.fillText(this.text, currentX, this.y);
  }

  private decideY(position: 'ue' | 'naka' | 'shita'): number {
    switch (position) {
      case 'ue':
        return Math.random() * 400; // 上半分
      case 'shita':
        return 600 + Math.random() * 200;
      default:
        return Math.random() * 800;
    }
  }
}
