import mongoose from 'mongoose'

const tourAnswerSchema = new mongoose.Schema(
  {
    tourId: { type: String, required: true },
    tourName: { type: String, required: true },
    language: { type: String, trim: true },
    enjoyment: { type: Number, min: 1, max: 5, required: true },
    overallExperience: { type: Number, min: 1, max: 5, required: true },
    interestInFutureCareer: { type: Number, min: 1, max: 5, required: true },
    // Tri-state Yes/No/Maybe response — stored as the human-readable label
    // itself (not a boolean) so "Maybe" has somewhere to live; exports map
    // these to numeric codes (Yes=1, No=2, Maybe=3) via a centralized helper.
    wantExploreCareer: { type: String, required: true, enum: ['Yes', 'No', 'Maybe'] },
    wantMoreTours: { type: String, required: true, enum: ['Yes', 'No', 'Maybe'] },
  },
  { _id: false },
)

const studentFeedbackSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    udise: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },

    grade: { type: String, required: true, trim: true },
    studentDummyId: { type: String, required: true },

    month: { type: String, required: true },
    financialYear: { type: String, required: true },

    tours: {
      type: [tourAnswerSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one tour response is required.',
      },
    },
  },
  { timestamps: true },
)

// Safety net, not the primary guarantee — studentFeedback.service.js already
// claims each Dummy ID atomically (School.studentDummyIdSequence via $inc),
// which is what actually prevents collisions. This index just makes any
// future bug or direct data insertion fail loudly instead of silently
// producing two students with the same ID at the same school.
studentFeedbackSchema.index({ school: 1, studentDummyId: 1 }, { unique: true })

studentFeedbackSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    udise: this.udise,
    schoolName: this.schoolName,
    grade: this.grade,
    studentDummyId: this.studentDummyId,
    month: this.month,
    financialYear: this.financialYear,
    tours: this.tours,
    createdAt: this.createdAt,
  }
}

export const StudentFeedback = mongoose.model('StudentFeedback', studentFeedbackSchema)
