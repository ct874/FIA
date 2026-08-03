import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

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
    // Teacher Portal login credential for this school. Defaults to the UDISE
    // itself — set explicitly (hashed) when a school is registered via the
    // Admin upload flow. Schools created before this field existed have no
    // password stored; comparePassword() falls back to matching the UDISE.
    password: {
      type: String,
      select: false,
    },
  },
  { timestamps: true },
)

schoolSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
  next()
})

schoolSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  if (this.password) {
    return bcrypt.compare(candidatePassword, this.password)
  }
  // Legacy school registered before password support existed.
  return candidatePassword === this.udise
}

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
