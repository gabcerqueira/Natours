const mongoose = require('mongoose');
const crypto = require('crypto');
const { default: validator } = require('validator');
const bcrypt = require('bcryptjs');
const UserRoles = require('../constants/userConstants');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    minlength: [5, 'The name is too short'],
    maxlength: [50, 'The name is too long'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function (input) {
        return validator.isEmail(input);
      },
      message: `Please provide a valid email`,
    },
  },
  photo: { type: String },
  role: {
    type: String,
    enum: [
      UserRoles.USER,
      UserRoles.ADMIN,
      UserRoles.LEAD_GUIDE,
      UserRoles.GUIDE,
    ],
    default: UserRoles.USER,
  },
  password: {
    type: String,
    required: [true, 'Please provide your password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    minlength: 8,
    select: false,
    validate: {
      //ONLY WORKS ON CREATE AND SAVE!!
      validator: function (input) {
        return input === this.password;
      },
      message: 'passwords must match ',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//função de um schema escolhido

userSchema.methods.correctPassword = async function (
  passwordInput,
  userPassword
) {
  return await bcrypt.compare(passwordInput, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(this.passwordChangedAt, JWTTimestamp);
    return JWTTimestamp < changedTimestamp;
  }
  //not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const TIME_TO_EXPIRE = Date.now() + 10 * 60 * 1000;
  this.passwordResetExpires = TIME_TO_EXPIRE;

  return resetToken;
};

//<-- Docs Middlewares -->
//Mongoose Middleware to encrypt and store passwords
userSchema.pre('save', async function (next) {
  // Only run if password is modified.
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;

  next();
});

// <-- Query Middlewares -->
userSchema.pre(/^find/, function (next) {
  //this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
