import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'username is required'],
      trim: true,
      maxLength: [40, 'username cannot exceed 40 characters']
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      trim: true,
      unique: true,
      lowercase: true,
      match: [
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/,
        'Please enter a valid email'
      ]
    },
    name: {
      type: String,
      required: [true, 'password is required'],
      minLength: [8, 'password must be at least 8 characters'],
      maxLength: [40, 'password cannot exceed 40 characters'],
      select: false
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'instructor', 'admin'],
        message: 'please select a valid role '
      },
      default: 'student'
    },
    avatar: {
      type: String,
      default: 'default.jpg'
    },
    bio: {
      type: String,
      maxLength: [160, 'bio cannot exceed 160 characters']
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course'
        },
        enrolledAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    createdCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    resetPasswordToken: String,
    resetPasswordExpiry: Date,
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//hashing the password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpiry = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.updateLastActive = function () {
  this.lastActive = Date.now();
  return this.lastActive({ validateBeforeSave: false });
};

// virtual fields for total enrolled courses
userSchema.virtual('totalEnrolledCourses').get(function () {
  return this.enrolledCourses.length;
});

const User = mongoose.model('User', userSchema);
