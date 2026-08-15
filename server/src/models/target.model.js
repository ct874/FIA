import mongoose from 'mongoose'

// District-level program targets, set by the Super Admin from the Target
// Management module — distinct from `computeRequiredFeedbackCount()` in
// utils/studentFeedbackTarget.js, which is the unrelated 40%-of-class quota
// used internally to gate the Teacher Portal's Student Feedback grade cards.
const positiveIntegerField = {
  type: Number,
  required: true,
  min: [1, '{PATH} must be a positive integer'],
  validate: {
    validator: Number.isInteger,
    message: '{PATH} must be a whole number, not a decimal',
  },
}

const targetSchema = new mongoose.Schema(
  {
    financialYear: { type: String, required: true, trim: true }, // "2026-27" — matches getCurrentFinancialYear()
    month: { type: String, required: true, trim: true }, // full month name — matches academicPeriod.js's MONTH_NAMES
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    teacherTarget: positiveIntegerField,
    studentTarget: positiveIntegerField,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', required: true },
  },
  { timestamps: true },
)

// One target per Financial Year + Month + District — re-saving the same
// combination updates the existing row instead of creating a duplicate.
targetSchema.index({ financialYear: 1, month: 1, district: 1 }, { unique: true })

targetSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    financialYear: this.financialYear,
    month: this.month,
    state: this.state,
    district: this.district,
    teacherTarget: this.teacherTarget,
    studentTarget: this.studentTarget,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export const Target = mongoose.model('Target', targetSchema)
