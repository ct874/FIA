import mongoose from 'mongoose'

// One row per district the Super Admin has EXPLICITLY configured a Student
// Feedback response target for — an unconfigured district simply has no
// row here at all, and the 40% default is applied in code (see
// services/districtFeedbackTarget.service.js), never written as a row.
// Distinct from models/target.model.js, which is the unrelated
// teacher/student-count Target Management module.
const districtFeedbackTargetSchema = new mongoose.Schema(
  {
    district: { type: String, required: true, trim: true, unique: true },
    targetPercent: {
      type: Number,
      required: true,
      min: [0, '{PATH} must be between 0 and 100'],
      max: [100, '{PATH} must be between 0 and 100'],
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', required: true },
  },
  { timestamps: true },
)

districtFeedbackTargetSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    district: this.district,
    targetPercent: this.targetPercent,
    updatedAt: this.updatedAt,
  }
}

export const DistrictFeedbackTarget = mongoose.model('DistrictFeedbackTarget', districtFeedbackTargetSchema)
