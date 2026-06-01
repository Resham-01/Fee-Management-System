const deriveShortName = (schoolName) => {
  const cleaned = String(schoolName || '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) return 'SCH';
  if (words.length === 1) return words[0].substring(0, 6).toUpperCase();

  return words
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 8);
};

const getSchoolShortName = (school) => {
  if (school?.shortName?.trim()) {
    return school.shortName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  return deriveShortName(school?.name);
};

module.exports = { deriveShortName, getSchoolShortName };
