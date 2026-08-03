import mongoose from 'mongoose'

const tourRefSchema = new mongoose.Schema(
  {
    tourId: { type: String, required: true },
    tourName: { type: String, required: true },
  },
  { _id: false },
)

const studentReachSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    udise: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },

    grade: { type: String, required: true, trim: true },
    studentsReached: { type: Number, required: true, min: 0 },
    uniqueStudentCount: { type: Number, required: true, min: 0 },
    tours: { type: [tourRefSchema], default: [] },
    language: { type: String, trim: true },

    month: { type: String, required: true },
    financialYear: { type: String, required: true },
  },
  { timestamps: true },
)

// One document per (school, grade) — kept unique across time (not per month)
// so repeat submissions for the same grade merge into it instead of creating
// a second record. `month`/`financialYear` reflect the most recent update.
studentReachSchema.index({ school: 1, grade: 1 }, { unique: true })

studentReachSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    udise: this.udise,
    schoolName: this.schoolName,
    grade: this.grade,
    studentsReached: this.studentsReached,
    uniqueStudentCount: this.uniqueStudentCount,
    tours: this.tours,
    language: this.language,
    month: this.month,
    financialYear: this.financialYear,
    createdAt: this.createdAt,
  }
}

export const StudentReach = mongoose.model('StudentReach', studentReachSchema)
