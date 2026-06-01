const getSchoolId = (user) => {
  if (!user?.school) return null;
  if (user.school._id) return user.school._id.toString();
  return user.school.toString();
};

module.exports = { getSchoolId };
