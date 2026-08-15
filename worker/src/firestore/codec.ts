// Encode/decode plain JS values <-> Firestore REST API's typed-value wire
// format (https://firebase.google.com/docs/firestore/reference/rest/v1/Value).
//
// Three sharp edges the REST API has that the Firebase Admin SDK normally
// hides from you, all handled explicitly below (getting any of these wrong
// is the #1 source of silent data-corruption bugs when hand-rolling a
// Firestore REST client):
//   1. `integerValue` is transmitted as a numeric STRING ("5", not 5) —
//      every read must parse it back to a JS number.
//   2. An empty array/map is returned as `{arrayValue: {}}` / `{mapValue: {}}`
//      with the `values`/`fields` key OMITTED entirely, not present-and-empty.
//   3. `undefined` fields must be dropped before encoding (Firestore has no
//      concept of "undefined", only "field not present" vs "null").
export type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } }

export type FirestoreFields = Record<string, FirestoreValue>

export function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value }
  }
  if (typeof value === 'string') return { stringValue: value }
  if (value instanceof Date) return { timestampValue: value.toISOString() }
  if (Array.isArray(value)) {
    const values = value.map((item) => encodeValue(item))
    return values.length > 0 ? { arrayValue: { values } } : { arrayValue: {} }
  }
  if (typeof value === 'object') {
    const fields = encodeFields(value as Record<string, unknown>)
    return Object.keys(fields).length > 0 ? { mapValue: { fields } } : { mapValue: {} }
  }
  throw new Error(`Cannot encode value of type ${typeof value} to a Firestore value`)
}

// Drops `undefined` entries (Firestore fields must be entirely absent, not
// "present with value undefined") — this is what makes partial-update call
// sites able to just spread an object without manually filtering.
export function encodeFields(obj: Record<string, unknown>): FirestoreFields {
  const fields: FirestoreFields = {}
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue
    fields[key] = encodeValue(value)
  }
  return fields
}

export function decodeValue(value: FirestoreValue | undefined): unknown {
  if (!value) return null
  if ('nullValue' in value) return null
  if ('booleanValue' in value) return value.booleanValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return value.doubleValue
  if ('stringValue' in value) return value.stringValue
  if ('timestampValue' in value) return value.timestampValue
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map((item) => decodeValue(item))
  if ('mapValue' in value) return decodeFields(value.mapValue.fields)
  return null
}

export function decodeFields(fields: FirestoreFields | undefined): Record<string, unknown> {
  if (!fields) return {}
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    result[key] = decodeValue(value)
  }
  return result
}

export interface FirestoreDocumentJSON {
  name: string
  fields?: FirestoreFields
  createTime?: string
  updateTime?: string
}

export interface DecodedDocument<T = Record<string, unknown>> {
  id: string
  path: string
  data: T
  createTime: string | null
  updateTime: string | null
}

// Firestore document `name` is the fully-qualified path
// `projects/{p}/databases/{d}/documents/{collection}/{id}[/...]` — the
// document ID is always the last `/`-separated segment.
export function decodeDocument<T = Record<string, unknown>>(doc: FirestoreDocumentJSON): DecodedDocument<T> {
  const segments = doc.name.split('/')
  const id = segments[segments.length - 1]
  return {
    id,
    path: doc.name,
    data: decodeFields(doc.fields) as T,
    createTime: doc.createTime ?? null,
    updateTime: doc.updateTime ?? null,
  }
}

// Firestore document IDs cannot contain `/`, cannot be exactly `.` or `..`,
// cannot match `__.*__`, and free-text values (district names, school
// names) may contain spaces/punctuation that would otherwise produce
// colliding or invalid IDs (e.g. "Sri Ganganagar" vs "Sri_Ganganagar" must
// not collide with an already-underscore-separated name). encodeURIComponent
// is reversible and collision-free for this purpose.
export function encodeIdSegment(segment: string): string {
  return encodeURIComponent(String(segment).trim())
}

export function decodeIdSegment(segment: string): string {
  return decodeURIComponent(segment)
}

// Single shared normalization for district names, used identically on both
// the write path (saving a District Feedback Target / Target) and the read
// path (looking up a school's district override during the 40% rule check)
// — a mismatch here would silently make every district fall back to the
// default 40% target, which is exactly the kind of quiet business-logic
// regression this helper exists to prevent.
export function normalizeDistrict(district: string): string {
  return String(district ?? '').trim().toLowerCase()
}
