import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

const superAdminSchema = new mongoose.Schema(
  {
    loginId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  { timestamps: true },
)

superAdminSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS)
})

superAdminSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

superAdminSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id,
    loginId: this.loginId,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

export const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema)
