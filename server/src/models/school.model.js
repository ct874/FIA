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
    // Running counter behind every Student Dummy ID generated for this
    // school (see utils/studentDummyId.js) — claimed atomically via $inc on
    // every new StudentFeedback submission, so the sequence is per-school,
    // never resets across grades, and is race-safe across concurrent
    // submissions/sessions. Internal bookkeeping only, never shown to users.
    studentDummyIdSequence: {
      type: Number,
      default: 0,
    },
    // Official government District Code / Postal Code for this school —
    // used by the AFE CSV (Official) export and the Student/Teacher
    // Feedback CSV exports. Admin-entered via Export Data -> Programme
    // Setup -> Per-School District Code & Postal Code, password-confirmed,
    // and then PERMANENTLY LOCKED (see school.controller.js's
    // updateSchoolExportCodes — a field only accepts a value while it's
    // still blank). Left blank ("") when not yet known — export logic
    // requires a blank cell in that case, never a placeholder.
    districtCode: {
      type: String,
      trim: true,
      default: '',
    },
    postalCode: {
      type: String,
      trim: true,
      default: '',
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
    districtCode: this.districtCode || '',
    postalCode: this.postalCode || '',
    createdAt: this.createdAt,
  }
}

export const School = mongoose.model('School', schoolSchema)
