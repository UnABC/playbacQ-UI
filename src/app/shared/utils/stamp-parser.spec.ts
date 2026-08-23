import { parseComment } from './stamp-parser';

describe('parseComment', () => {
  let getStampDataMock: (name: string) => any;

  beforeEach(() => {
    getStampDataMock = (name: string) => {
      if (name === 'validStamp') {
        return { name: 'validStamp', isAnimated: false };
      }
      return null;
    };
  });

  it('should return the same text if there are no stamps', () => {
    const comment = 'This is a test comment without stamps.';
    const result = parseComment(comment, getStampDataMock);
    expect(result).toEqual([{ type: 'text', text: comment }]);
  });

  it('should parse a comment with a valid stamp', () => {
    const comment = 'This is a test comment with a :validStamp: in it.';
    const result = parseComment(comment, getStampDataMock);
    expect(result).toEqual([
      { type: 'text', text: 'This is a test comment with a ' },
      {
        type: 'stamp',
        name: 'validStamp',
        stampData: { name: 'validStamp', isAnimated: false },
        effects: [],
      },
      { type: 'text', text: ' in it.' },
    ]);
  });

  it('should treat an invalid stamp as text', () => {
    const comment = 'This is a test comment with an :invalidStamp: in it.';
    const result = parseComment(comment, getStampDataMock);
    expect(result).toEqual([
      { type: 'text', text: 'This is a test comment with an ' },
      { type: 'text', text: ':invalidStamp:' },
      { type: 'text', text: ' in it.' },
    ]);
  });

  it('should return an empty array for an empty comment', () => {
    const comment = '';
    const result = parseComment(comment, getStampDataMock);
    expect(result).toEqual([]);
  });
});
