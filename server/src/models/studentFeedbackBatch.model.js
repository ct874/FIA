import mongoose from 'mongoose'

const tourRefSchema = new mongoose.Schema(
  {
    tourId: { type: String, required: true },
    tourName: { type: String, required: true },
  },
  { _id: false },
)

// Tracks one "batch" of Student Feedback a teacher intends to collect for a
// grade — which Career Tour(s), what language, and how many students'
// feedback they're collecting. This replaces the old separate Student Reach
// workflow step: the teacher now declares this directly when starting
// Student Feedback instead of in a prior "reach" stage.
const studentFeedbackBatchSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    udise: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },

    grade: { type: String, required: true, trim: true },
    studentCount: { type: Number, required: true, min: 1 },
    tours: { type: [tourRefSchema], default: [] },
    // No longer collected from the teacher (the "In which language did
    // students watch the Career Tour?" question was removed from the Start
    // Feedback form) — kept as an optional field, never required, so older
    // batches that do have a value keep displaying it.
    language: { type: String, trim: true, default: '' },

    month: { type: String, required: true },
    financialYear: { type: String, required: true },
  },
  { timestamps: true },
)

// One document per (school, grade) — repeat submissions for the same grade
// merge into it instead of creating a second record (see
// studentFeedbackBatch.service.js): student counts add up, tours union, and
// language/month/financialYear move forward to the latest submission.
studentFeedbackBatchSchema.index({ school: 1, grade: 1 }, { unique: true })

studentFeedbackBatchSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    udise: this.udise,
    schoolName: this.schoolName,
    grade: this.grade,
    studentCount: this.studentCount,
    tours: this.tours,
    language: this.language,
    month: this.month,
    financialYear: this.financialYear,
    createdAt: this.createdAt,
  }
}

export const StudentFeedbackBatch = mongoose.model('StudentFeedbackBatch', studentFeedbackBatchSchema)
