import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Comment } from './comment';
import { CommentSegment } from '../../shared/utils/stamp-parser';
import * as stampParser from '../../shared/utils/stamp-parser';

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
        measureText: vi.fn().mockReturnValue({ width: 50 }),
        drawImage: vi.fn(),
        fillRect: vi.fn(),
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
      expect(mockCtx.measureText).toHaveBeenCalledWith('テスト');

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
    it('should properly calculate stamp size based on effects when parsing segments in constructor', () => {
      const mockStampService = {
        getStampImage: vi.fn().mockReturnValue({
          isAnimated: false,
          staticImage: { complete: true, naturalWidth: 32 },
        }),
      } as any;
      // default: 1.2
      const commentNormal = new Comment(':stamp:', 0, '', mockStampService);
      // ex-large: 1.2 * 2.0 = 2.4
      const commentExLarge = new Comment(':stamp.ex-large:', 0, '', mockStampService);
      // large: 1.2 * 1.5 = 1.8
      const commentLarge = new Comment(':stamp.large:', 0, '', mockStampService);
      // small: 1.2 * 0.6 = 0.72
      const commentSmall = new Comment(':stamp.small:', 0, '', mockStampService);
      const fontSize = (commentNormal as any).fontSize;
      expect((commentNormal as any).textXsize).toBe(Math.round(fontSize * 1.2));
      expect((commentExLarge as any).textXsize).toBe(Math.round(fontSize * 2.4));
      expect((commentLarge as any).textXsize).toBe(Math.round(fontSize * 1.8));
      expect((commentSmall as any).textXsize).toBe(Math.round(fontSize * 0.72));
    });
    it('should ignore unknown segment type when calculating textLength in constructor', () => {
      const parseSpy = vi
        .spyOn(stampParser, 'parseComment')
        .mockReturnValue([{ type: 'unknown' } as unknown as CommentSegment]);
      const mockStampService = { getStampImage: vi.fn() } as any;
      const comment = new Comment('dummy', 0, '', mockStampService);
      expect((comment as any).textXsize).toBe(0);
      parseSpy.mockRestore();
    });

    it('should draw stamp segment when image is loaded', () => {
      const mockStampService = {
        stamps: vi.fn().mockReturnValue(new Map([['stamp1', 'id1']])),
        getStampImage: vi.fn().mockReturnValue({
          isAnimated: false,
          staticImage: {
            complete: true,
            naturalWidth: 32,
          },
        }),
      } as any;
      const comment = new Comment(':stamp1: テスト', 1000, '', mockStampService);
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.drawImage).toHaveBeenCalled();
      expect(mockCtx.strokeText).toHaveBeenCalledWith(
        ' テスト',
        expect.any(Number),
        expect.any(Number),
      );
      expect(mockCtx.measureText).toHaveBeenCalledWith(' テスト');
    });

    it('should draw placeholder when stamp image is not loaded yet', () => {
      const mockStampService = {
        stamps: vi.fn().mockReturnValue(new Map([['stamp1', 'id1']])),
        getStampImage: vi.fn().mockReturnValue({
          isAnimated: false,
          staticImage: {
            complete: false,
            naturalWidth: 0,
          },
        }),
      } as any;
      const comment = new Comment(':stamp1:', 1000, '', mockStampService);
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
    it('should draw animated stamp when available', () => {
      const mockStampService = {
        stamps: vi.fn().mockReturnValue(new Map([['stamp1', 'id1']])),
        getStampImage: vi.fn().mockReturnValue({
          isAnimated: true,
          frames: [
            { bitmap: {} as ImageBitmap, delay: 0 },
            { bitmap: {} as ImageBitmap, delay: 100 },
            { bitmap: {} as ImageBitmap, delay: 100 },
          ],
          totalDuration: 200,
        }),
      } as any;
      const comment = new Comment(':stamp1:', 1000, '', mockStampService);
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });
    it('should properly calculate stamp size based on effects', () => {
      const mockStampService = {
        stamps: vi.fn().mockReturnValue(new Map([['stamp1', 'id1']])),
        getStampImage: vi.fn().mockReturnValue({
          isAnimated: false,
          staticImage: {
            complete: true,
            naturalWidth: 32,
          },
        }),
      } as any;

      const commentSeg: CommentSegment = {
        type: 'stamp',
        name: ':stamp1:',
        stampData: null,
        effects: ['ex-large'],
      };
      const comment = new Comment(':stamp1:', 1000, '', mockStampService);
      (comment as any).commentSegments = [commentSeg];
      (comment as any).fontSize = 50;
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.any(Number),
        100,
        100,
      );

      const commentSeg2: CommentSegment = {
        type: 'stamp',
        name: ':stamp1:',
        stampData: null,
        effects: ['large'],
      };
      (comment as any).commentSegments = [commentSeg2];
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.any(Number),
        75,
        75,
      );

      const commentSeg3: CommentSegment = {
        type: 'stamp',
        name: ':stamp1:',
        stampData: null,
        effects: ['small'],
      };
      (comment as any).commentSegments = [commentSeg3];
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Number),
        expect.any(Number),
        30,
        30,
      );
    });
    it('should do nothing if segment type is unknown', () => {
      const mockStampService = {
        stamps: vi.fn().mockReturnValue(new Map([['stamp1', 'id1']])),
        getStampImage: vi.fn().mockReturnValue({
          isAnimated: false,
          staticImage: {
            complete: true,
            naturalWidth: 32,
          },
        }),
      } as any;
      const commentSeg: CommentSegment = {
        type: 'unknown' as any,
        name: ':stamp1:',
        stampData: null,
        effects: [],
      };
      const comment = new Comment(':stamp1:', 1000, '', mockStampService);
      (comment as any).commentSegments = [commentSeg];
      comment.draw(mockCtx as CanvasRenderingContext2D, 1000);
      expect(mockCtx.drawImage).not.toHaveBeenCalled();
      expect(mockCtx.strokeText).not.toHaveBeenCalled();
      expect(mockCtx.fillText).not.toHaveBeenCalled();
    });
  });
});
