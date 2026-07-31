import mongoose from 'mongoose'

const schoolSchema = new mongoose.Schema(
  {
    udise: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
)

schoolSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    udise: this.udise,
    schoolName: this.schoolName,
    district: this.district,
    state: this.state,
    createdAt: this.createdAt,
  }
}

export const School = mongoose.model('School', schoolSchema)
