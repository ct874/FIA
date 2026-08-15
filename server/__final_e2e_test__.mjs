// End-to-end test of the real Express app + real route/middleware chain +
// real School model (with the fix applied), mocked only at the Mongoose
// query boundary (no live MongoDB in this sandbox) — reproduces exactly
// the reported user flow: PATCH /schools/:udise/export-codes with a
// password, via the real HTTP stack.
import jwt from 'jsonwebtoken'
import { env } from './src/config/env.js'
import { School } from './src/models/school.model.js'
import { SuperAdmin } from './src/models/superAdmin.model.js'

// In-memory fake "database" for School, backed by the REAL Mongoose
// document class (so the real pre('save') hook actually runs), just
// without a real MongoDB connection underneath.
const store = new Map()
store.set('08180100137', new School({ udise: '08180100137', schoolName: 'Test School', district: 'D', state: 'ST' }))
store.get('08180100137').isNew = false

School.findOne = async (query) => store.get(query.udise) || null
// Override the real Document.prototype.save just for persistence (keep the
// real pre-save hook pipeline by calling the original save's hook runner
// indirectly is overkill here — instead we let Mongoose validate/hash via
// its OWN save(), but redirect the final DB write to our in-memory map).
const originalSave = School.prototype.save
School.prototype.save = async function fakeSave(...args) {
  await this.$__.saveOptions // no-op, keep signature parity
  await new Promise((resolve, reject) => {
    this.schema.s.hooks.execPre('save', this, [], (err) => (err ? reject(err) : resolve()))
  })
  store.set(this.udise, this)
  return this
}

const superAdminDoc = { _id: 'admin1', comparePassword: async (pw) => pw === 'fia@123' }
SuperAdmin.findById = () => ({ select: async () => superAdminDoc })

const { default: app } = await import('./src/app.js')
const server = app.listen(0)
await new Promise((r) => server.once('listening', r))
const port = server.address().port
const token = jwt.sign({ sub: 'admin1' }, env.jwt.secret)
const url = `http://127.0.0.1:${port}/api/schools/08180100137/export-codes`

async function patch(body) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}

// Test 3 first — wrong password must not save anything.
const wrong = await patch({ districtCode: 'S08116', postalCode: '342001', password: 'wrong-password' })
console.log('Test 3 (wrong password) status:', wrong.status, wrong.body.message)
console.log('  DB untouched:', store.get('08180100137').districtCode === '' ? 'PASS' : 'FAIL')

// Test 1 — correct password saves.
const ok = await patch({ districtCode: 'S08116', postalCode: '342001', password: 'fia@123' })
console.log('\nTest 1 (correct password) status:', ok.status, JSON.stringify(ok.body.data))
console.log('  No "next is not a function":', !JSON.stringify(ok.body).includes('next is not a function') ? 'PASS' : 'FAIL')
console.log('  Saved correctly:', ok.body.data?.districtCode === 'S08116' && ok.body.data?.postalCode === '342001' ? 'PASS' : 'FAIL')

// Re-save attempt (already-locked fields) — should silently no-op, not error.
const relock = await patch({ districtCode: 'HACKED', postalCode: '999999', password: 'fia@123' })
console.log('\nRe-save after lock status:', relock.status, JSON.stringify(relock.body.data))
console.log('  Values unchanged (locked):', relock.body.data?.districtCode === 'S08116' && relock.body.data?.postalCode === '342001' ? 'PASS' : 'FAIL')

School.prototype.save = originalSave
server.close()
