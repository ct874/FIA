// bcryptjs (pure JS, no native bindings) kept as-is so hashes already in
// the database (migrated from MongoDB) keep verifying without forcing any
// password resets. `compare()` needs no randomness and runs fine in a bare
// Workers isolate; `hash()` needs a CSPRNG, which bcryptjs >= 3.x gets from
// Web Crypto's `getRandomValues` (no `nodejs_compat` dependency for this
// specific concern — the flag is enabled anyway for SheetJS, see
// wrangler.jsonc).
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS)
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash)
}
