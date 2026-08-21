const { getSchoolId } = require('./getSchoolId');

describe('getSchoolId', () => {
  test('returns null when user has no school', () => {
    expect(getSchoolId(null)).toBeNull();
    expect(getSchoolId({})).toBeNull();
  });

  test('returns stringified _id from a populated school object', () => {
    const user = { school: { _id: 'abc123' } };
    expect(getSchoolId(user)).toBe('abc123');
  });

  test('returns a plain string school id as-is', () => {
    expect(getSchoolId({ school: 'school-1' })).toBe('school-1');
  });
});