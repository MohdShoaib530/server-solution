import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxLength: [100, 'Course title can not exceed 100 characters']
    },
    subtitle: {
      type: String,
      trim: true,
      maxLength: [200, 'Course subtitle can not exceed 200 characters']
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Course category is required']
    },
    level: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced'],
        message: ['please select a valid course level']
      },
      default: 'beginner',
      price: {
        type: Number,
        required: [true, 'Course price is required'],
        min: [0, 'Course price can not be less than 0']
      },
      thumbnail: {
        type: String,
        required: [true, 'Course thumbnail is required']
      },
      enrolledStudents: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      ],
      lectures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Lecture'
        }
      ],
      instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Course instructor is required']
      },
      isPublished: {
        type: Boolean,
        default: false
      },
      totalDuration: {
        type: Number,
        default: 0
      },
      toatlLectures: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

courseSchema.virtual('averageRating').get(function () {
  return 0;
});

courseSchema.pre('save', function (next) {
  if (this.lectures) {
    this.toatlLectures = this.lectures.length;
  }

  next();
});

export const Course = mongoose.model('Course', courseSchema);
