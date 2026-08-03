import mongoose from 'mongoose'

const teacherFeedbackSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    udise: { type: String, required: true, trim: true },
    schoolName: { type: String, required: true, trim: true },

    tourId: { type: String, required: true },
    tourName: { type: String, required: true },
    language: { type: String, trim: true },

    submittedBy: { type: String, required: true, trim: true },
    contactNumber: { type: String, trim: true },

    month: { type: String, required: true },
    financialYear: { type: String, required: true },

    recommendScore: { type: Number, min: 0, max: 10, required: true },
    satisfactionResources: { type: Number, min: 1, max: 5, required: true },
    easeIntegration: { type: Number, min: 1, max: 5, required: true },
    biggestBenefit: { type: String, trim: true, default: '' },
    improvements: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
)

teacherFeedbackSchema.index({ school: 1, tourId: 1, month: 1, financialYear: 1 }, { unique: true })

teacherFeedbackSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    udise: this.udise,
    schoolName: this.schoolName,
    tourId: this.tourId,
    tourName: this.tourName,
    language: this.language,
    submittedBy: this.submittedBy,
    contactNumber: this.contactNumber,
    month: this.month,
    financialYear: this.financialYear,
    recommendScore: this.recommendScore,
    satisfactionResources: this.satisfactionResources,
    easeIntegration: this.easeIntegration,
    biggestBenefit: this.biggestBenefit,
    improvements: this.improvements,
    createdAt: this.createdAt,
  }
}

export const TeacherFeedback = mongoose.model('TeacherFeedback', teacherFeedbackSchema)
