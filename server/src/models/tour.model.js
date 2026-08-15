import mongoose from 'mongoose'

// Single source of truth for "currently offered" Career Tours — AWS/Robotics/
// Music are seeded into this collection once at server startup (see
// services/tours.service.js's ensureSeedTours()) so they're indistinguishable
// from a Super-Admin-created tour, letting create/delete use one code path
// for every tour instead of special-casing the original three.
const tourSchema = new mongoose.Schema(
  {
    // e.g. 'CT-L-AWS-01' (existing) or 'CT-L-CUSTOM-4' (Super-Admin-created).
    tourId: { type: String, required: true, unique: true, trim: true },
    tourName: { type: String, required: true, trim: true },
    // The "Tour ID" shown throughout the product spec: AWS=1, Robotics=2,
    // Music=3, and every tour created afterwards gets the next unused number
    // (never reused, never re-assigned — see getNextTourCode()).
    code: {
      type: Number,
      required: true,
      unique: true,
      min: [1, '{PATH} must be a positive integer'],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: [1, '{PATH} must be a positive integer'],
    },
    // null for the 3 seeded tours — they weren't "created" by anyone.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperAdmin', default: null },
    // Soft-delete flag, null while active. Deleting a tour never removes
    // its row — it only stops it from being offered/listed (see
    // tours.service.js's listTours()/refreshTourCache(), which both filter
    // on this) — so its `code` can never be handed out again to a
    // different tour (getNextTourCode() considers every row, deleted or
    // not), and so a deleted ORIGINAL tour (AWS/Robotics/Music) stays
    // deleted across a server restart instead of being silently re-seeded.
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

tourSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    tourId: this.tourId,
    tourName: this.tourName,
    code: this.code,
    durationMinutes: this.durationMinutes,
    createdAt: this.createdAt,
  }
}

export const Tour = mongoose.model('Tour', tourSchema)
