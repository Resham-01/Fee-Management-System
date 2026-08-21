import { GRADE_OPTIONS } from './grades';

describe('GRADE_OPTIONS', () => {
  test('covers grades 1 through 12', () => {
    expect(GRADE_OPTIONS).toHaveLength(12);
    expect(GRADE_OPTIONS[0]).toBe('Grade 1');
    expect(GRADE_OPTIONS[GRADE_OPTIONS.length - 1]).toBe('Grade 12');
  });

  test('contains no duplicate or empty entries', () => {
    expect(new Set(GRADE_OPTIONS).size).toBe(GRADE_OPTIONS.length);
    GRADE_OPTIONS.forEach((grade) => expect(grade.trim()).not.toBe(''));
  });
});