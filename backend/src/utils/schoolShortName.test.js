const { deriveShortName, getSchoolShortName } = require('./schoolShortName');

describe('deriveShortName', () => {
  test('returns SCH for empty or invalid names', () => {
    expect(deriveShortName('')).toBe('SCH');
    expect(deriveShortName(null)).toBe('SCH');
    expect(deriveShortName('   ')).toBe('SCH');
  });

  test('returns first 6 chars uppercase for a single word', () => {
    expect(deriveShortName('Himalaya')).toBe('HIMALA');
  });

  test('builds initials for multiple words', () => {
    expect(deriveShortName('Mid Valley School')).toBe('MVS');
  });

  test('strips special characters', () => {
    expect(deriveShortName('Mid! Valley@ School#')).toBe('MVS');
  });

  test('truncates initials to 8 characters', () => {
    expect(deriveShortName('A B C D E F G H I J')).toBe('ABCDEFGH');
  });
});

describe('getSchoolShortName', () => {
  test('normalizes an existing shortName', () => {
    expect(getSchoolShortName({ shortName: ' mid-valley! ' })).toBe('MIDVALLEY');
  });

  test('derives from name when no shortName exists', () => {
    expect(getSchoolShortName({ name: 'Mid Valley School' })).toBe('MVS');
  });

  test('falls back to SCH for empty input', () => {
    expect(getSchoolShortName(null)).toBe('SCH');
    expect(getSchoolShortName({})).toBe('SCH');
  });
});