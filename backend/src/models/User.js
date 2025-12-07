const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  SCHOOL_ADMIN: 'school_admin',
  PARENT: 'parent',
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: function () {
        return this.role === USER_ROLES.SCHOOL_ADMIN || this.role === USER_ROLES.PARENT;
      },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = { User: mongoose.model('User', userSchema), USER_ROLES };



