import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Comment } from './comment';

describe('Comment Class', () => {
  it('should initialize with the correct timestamp and position', () => {
    const comment = new Comment('テスト', 1000, '');

    expect(comment.timestamp).toBe(1000);
    expect(comment.position).toBe('naka');
    expect((comment as any).fillColor).toBe('#ffffff');
    expect((comment as any).strokeColor).toBe('#000000');
  });
  it('should analyze correctly the command for position', () => {
    const commentUe = new Comment('テスト', 0, 'ue big');
    expect(commentUe.position).toBe('ue');
    expect((commentUe as any).speed).toBe(0);

    const commentShita = new Comment('テスト', 0, 'shita');
    expect(commentShita.position).toBe('shita');
    expect((commentShita as any).speed).toBe(0);

    const commentNaka = new Comment('テスト', 0, 'naka');
    expect(commentNaka.position).toBe('naka');
    expect((commentNaka as any).speed).toBe(480);
  });
  it('should analyze correctly the command for color', () => {
    const commentDefault = new Comment('テスト', 0, '');
    expect((commentDefault as any).fillColor).toBe('#ffffff');

    const commentWhite = new Comment('テスト', 0, 'white');
    expect((commentWhite as any).fillColor).toBe('#ffffff');
    const commentGray = new Comment('テスト', 0, 'gray');
    expect((commentGray as any).fillColor).toBe('#808080');
    const commentBrown = new Comment('テスト', 0, 'brown');
    expect((commentBrown as any).fillColor).toBe('#01407F');
    const commentGreen = new Comment('テスト', 0, 'green');
    expect((commentGreen as any).fillColor).toBe('#238F23');
    const commentCyan = new Comment('テスト', 0, 'cyan');
    expect((commentCyan as any).fillColor).toBe('#B2ECED');
    const commentBlue = new Comment('テスト', 0, 'blue');
    expect((commentBlue as any).fillColor).toBe('#0000FF');
    const commentYellow = new Comment('テスト', 0, 'yellow');
    expect((commentYellow as any).fillColor).toBe('#FFFF00');
    const commentOrange = new Comment('テスト', 0, 'orange');
    expect((commentOrange as any).fillColor).toBe('#FF8000');
    const commentRed = new Comment('テスト', 0, 'red');
    expect((commentRed as any).fillColor).toBe('#FF0000');

    const commentHex = new Comment('テスト', 0, '#123456');
    expect((commentHex as any).fillColor).toBe('#123456');

    const commentBlack = new Comment('テスト', 0, 'black');
    expect((commentBlack as any).fillColor).toBe('#000000');
    expect((commentBlack as any).strokeColor).toBe('#ffffff');
  });
  it('should set font size based on command', () => {
    // 通常
    const commentBig = new Comment('テスト', 0, 'big');
    expect((commentBig as any).font).toContain('115px');
    const commentMedium = new Comment('テスト', 0, 'medium');
    expect((commentMedium as any).font).toContain('78px');
    const commentSmall = new Comment('テスト', 0, 'small');
    expect((commentSmall as any).font).toContain('53px');
    // 複数行
    const multiLineText = 'テスト\nテスト\nテスト\nテスト\nテスト\nテスト\nテスト';
    const commentBigMulti = new Comment(multiLineText, 0, 'big');
    expect((commentBigMulti as any).font).toContain('393px');
    const commentMediumMulti = new Comment(multiLineText, 0, 'medium');
    expect((commentMediumMulti as any).font).toContain('248px');
    const commentSmallMulti = new Comment(multiLineText, 0, 'small');
    expect((commentSmallMulti as any).font).toContain('168px');
  });
  it('should set font name based on command', () => {
    const commentGothic = new Comment('テスト', 0, 'gothic');
    expect((commentGothic as any).font).toContain('sans-serif');
    const commentMincho = new Comment('テスト', 0, 'mincho');
    expect((commentMincho as any).font).toContain('serif');
  });

  describe('draw method', () => {
    let mockCtx: any;
    beforeEach(() => {
      mockCtx = {
        strokeText: vi.fn(),
        fillText: vi.fn(),
      };
    });
    it('should skip drawing if currentTime is before appearTime', () => {
      const comment = new Comment('テスト', 0, '');
      (comment as any).appearTime = 1000;
      comment.draw(mockCtx, 500);
      expect(mockCtx.strokeText).not.toHaveBeenCalled();
      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });
    it('should skip drawing if currentTime is after disappear time', () => {
      const comment = new Comment('テスト', 0, '');
      (comment as any).appearTime = 1000;
      comment.draw(mockCtx, 4000);
      expect(mockCtx.strokeText).not.toHaveBeenCalled();
      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });
    it('should draw text with stroke and fill', () => {
      const comment = new Comment('テスト', 1000, 'red big naka');
      comment.y = 100;
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.fillStyle).toBe('#FF0000');
      expect(mockCtx.textBaseline).toBe('top');
      expect(mockCtx.strokeText).toHaveBeenCalledWith('テスト', expect.any(Number), 100);
      expect(mockCtx.fillText).toHaveBeenCalledWith('テスト', expect.any(Number), 100);

      // ueやshitaの場合はy座標が変わることも確認
      comment.position = 'ue';
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.fillText).toHaveBeenCalledWith('テスト', expect.any(Number), 100);
      expect(mockCtx.strokeText).toHaveBeenCalledWith('テスト', expect.any(Number), 100);

      comment.position = 'shita';
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.fillText).toHaveBeenCalledWith('テスト', expect.any(Number), 100);
      expect(mockCtx.strokeText).toHaveBeenCalledWith('テスト', expect.any(Number), 100);
    });
  });
});
