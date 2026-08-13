// Minimal Firestore REST API client — get/list/query/commit/transaction/
// aggregation-count, built directly on `fetch` + the codec in ./codec.ts.
// Every repository in ../repositories/* goes through this module; nothing
// outside worker/src/firestore/* ever touches the Firestore wire format
// directly (keeps the "hand-rolled REST calls scattered through
// controllers" anti-pattern out of the codebase entirely, per the plan).
//
// Local dev: when `FIRESTORE_EMULATOR_HOST` is set (wrangler dev picks this
// up from .dev.vars), requests go to the emulator over plain HTTP with no
// OAuth token needed — this is what lets `npm run dev` run entirely against
// a local Firestore emulator instead of production data.
import type { Env } from '../env'
import { getFirestoreAccessToken } from './auth'
import {
  decodeDocument,
  decodeFields,
  encodeFields,
  encodeIdSegment,
  type DecodedDocument,
  type FirestoreDocumentJSON,
  type FirestoreFields,
  type FirestoreValue,
} from './codec'

function emulatorHost(env: Env): string | undefined {
  return (env as unknown as Record<string, string | undefined>).FIRESTORE_EMULATOR_HOST
}

function documentsRoot(env: Env): string {
  const emulator = emulatorHost(env)
  const base = emulator
    ? `http://${emulator}/v1`
    : 'https://firestore.googleapis.com/v1'
  return `${base}/projects/${env.FIREBASE_PROJECT_ID}/databases/${env.FIRESTORE_DATABASE_ID}/documents`
}

async function authHeader(env: Env): Promise<Record<string, string>> {
  if (emulatorHost(env)) return {} // emulator accepts unauthenticated requests
  const token = await getFirestoreAccessToken(env)
  return { Authorization: `Bearer ${token}` }
}

async function request<T>(env: Env, method: string, url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeader(env)),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 404) return null as T
  if (!response.ok) {
    const text = await response.text()
    throw new FirestoreError(response.status, text)
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

export class FirestoreError extends Error {
  status: number
  constructor(status: number, body: string) {
    super(`Firestore request failed (${status}): ${body}`)
    this.status = status
  }
}

// -- Document CRUD -----------------------------------------------------

export async function getDoc<T = Record<string, unknown>>(
  env: Env,
  collectionPath: string,
  id: string,
): Promise<DecodedDocument<T> | null> {
  const url = `${documentsRoot(env)}/${collectionPath}/${encodeIdSegment(id)}`
  const doc = await request<FirestoreDocumentJSON | null>(env, 'GET', url)
  return doc ? decodeDocument<T>(doc) : null
}

// Fails with 409 ALREADY_EXISTS if a document at this ID already exists —
// this IS the uniqueness-enforcement mechanism that replaces Mongo's unique
// indexes for "insert, never silently overwrite" call sites (e.g. Teacher
// Feedback's one-submission-session-per-school-per-tour rule).
export async function createDoc<T extends object>(
  env: Env,
  collectionPath: string,
  id: string,
  data: T,
): Promise<DecodedDocument<T>> {
  // documents.createDocument's URL shape is POST .../documents/{parent}/{collectionId}?documentId={id}
  // — every collection in this app is top-level (no subcollections), so
  // `collectionPath` IS the collectionId and parent is empty.
  const createDocUrl = `${documentsRoot(env)}/${collectionPath}?documentId=${encodeIdSegment(id)}`
  const doc = await request<FirestoreDocumentJSON>(env, 'POST', createDocUrl, {
    fields: encodeFields(data as Record<string, unknown>),
  })
  return decodeDocument<T>(doc)
}

export interface PatchOptions {
  // Only these top-level field names are written; every other existing
  // field on the document is left untouched. Omitting this entirely would
  // make the PATCH an overwrite-the-whole-document call, which is the #1
  // footgun of the Firestore REST API (the inverse of Mongo's `$set`).
  updateMask: string[]
  // Set true only for genuinely-intentional full-document overwrites.
  fullOverwrite?: boolean
}

// Upsert-by-default (creates the document if it doesn't exist yet) — used
// for merge-style writes (District Feedback Target save, Target upsert,
// Student Feedback Batch merge-on-repeat).
export async function patchDoc<T extends object>(
  env: Env,
  collectionPath: string,
  id: string,
  data: T,
  options: PatchOptions,
): Promise<DecodedDocument<T>> {
  const maskParams = options.fullOverwrite
    ? ''
    : `?${options.updateMask.map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join('&')}`
  const url = `${documentsRoot(env)}/${collectionPath}/${encodeIdSegment(id)}${maskParams}`
  const doc = await request<FirestoreDocumentJSON>(env, 'PATCH', url, { fields: encodeFields(data as Record<string, unknown>) })
  return decodeDocument<T>(doc)
}

export async function deleteDoc(env: Env, collectionPath: string, id: string): Promise<void> {
  const url = `${documentsRoot(env)}/${collectionPath}/${encodeIdSegment(id)}`
  await request<null>(env, 'DELETE', url)
}

// Fetches many documents by ID in as few round trips as possible via
// Firestore's `:batchGet` — used for the school-upload dedupe check
// ("which of these ~hundreds of UDISEs already exist?") instead of either
// one GET per ID (blows the Workers subrequest limit on a large upload) or
// a `where(__name__, IN, ...)` query (capped at 30 values per Firestore).
export async function getDocsByIds<T = Record<string, unknown>>(
  env: Env,
  collectionPath: string,
  ids: string[],
): Promise<Map<string, DecodedDocument<T>>> {
  const found = new Map<string, DecodedDocument<T>>()
  if (ids.length === 0) return found

  const CHUNK_SIZE = 300
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) chunks.push(ids.slice(i, i + CHUNK_SIZE))

  const root = `projects/${env.FIREBASE_PROJECT_ID}/databases/${env.FIRESTORE_DATABASE_ID}/documents`
  await Promise.all(
    chunks.map(async (chunk) => {
      const documents = chunk.map((id) => `${root}/${collectionPath}/${encodeIdSegment(id)}`)
      const url = `${documentsRoot(env)}:batchGet`
      const rows = await request<Array<{ found?: FirestoreDocumentJSON; missing?: string }>>(env, 'POST', url, { documents })
      for (const row of rows ?? []) {
        if (row.found) {
          const decoded = decodeDocument<T>(row.found)
          found.set(decoded.id, decoded)
        }
      }
    }),
  )

  return found
}

// -- Atomic field transforms (increment) --------------------------------

// Applies a server-side atomic increment to one numeric field and returns
// its POST-increment value, in one round trip, with no read-modify-write
// race — this is what backs the Student Dummy ID sequence (per school) and
// the Tour numeric-code counter (meta/tourCounter), both of which must
// never hand out the same number twice under concurrent requests.
export async function incrementField(
  env: Env,
  collectionPath: string,
  id: string,
  field: string,
  incrementBy: number,
): Promise<number> {
  const name = `projects/${env.FIREBASE_PROJECT_ID}/databases/${env.FIRESTORE_DATABASE_ID}/documents/${collectionPath}/${encodeIdSegment(id)}`
  // `update` with an empty field set + empty updateMask ("touch no plain
  // fields") combined with `updateTransforms` is the current (non-
  // deprecated) way to run an atomic transform — this also upserts the
  // document if it doesn't exist yet, same as a plain patch would.
  const body = {
    writes: [
      {
        update: { name, fields: {} },
        updateMask: { fieldPaths: [] },
        updateTransforms: [{ fieldPath: field, increment: { integerValue: String(incrementBy) } }],
      },
    ],
  }
  const result = await commitWithRetry<{
    writeResults: Array<{ transformResults?: FirestoreValue[] }>
  }>(env, body)
  const transformed = result.writeResults?.[0]?.transformResults?.[0]
  return transformed ? Number((transformed as { integerValue: string }).integerValue) : incrementBy
}

// -- Structured queries ---------------------------------------------------

export interface StructuredQueryFilter {
  field: string
  op:
    | 'EQUAL'
    | 'LESS_THAN'
    | 'LESS_THAN_OR_EQUAL'
    | 'GREATER_THAN'
    | 'GREATER_THAN_OR_EQUAL'
    | 'NOT_EQUAL'
  value: unknown
}

export interface QueryOptions {
  from: string // collection id
  where?: StructuredQueryFilter[]
  orderBy?: { field: string; direction?: 'ASCENDING' | 'DESCENDING' }[]
  limit?: number
  select?: string[] // field projection — cuts response size on wide documents (e.g. the AFE export scans)
  startAfterValues?: unknown[] // cursor pagination
}

function buildStructuredQuery(options: QueryOptions) {
  const filters = (options.where ?? []).map((filter) => ({
    fieldFilter: {
      field: { fieldPath: filter.field },
      op: filter.op,
      value: encodeFilterValue(filter.value),
    },
  }))

  return {
    ...(options.select ? { select: { fields: options.select.map((field) => ({ fieldPath: field })) } } : {}),
    from: [{ collectionId: options.from }],
    ...(filters.length === 1
      ? { where: filters[0] }
      : filters.length > 1
        ? { where: { compositeFilter: { op: 'AND', filters } } }
        : {}),
    ...(options.orderBy
      ? { orderBy: options.orderBy.map((o) => ({ field: { fieldPath: o.field }, direction: o.direction ?? 'ASCENDING' })) }
      : []),
    ...(options.limit ? { limit: options.limit } : {}),
    ...(options.startAfterValues ? { startAt: { values: options.startAfterValues.map(encodeFilterValue), before: false } } : {}),
  }
}

function encodeFilterValue(value: unknown): FirestoreValue {
  // Reuses the same scalar encoding as document fields.
  return require_encodeValue(value)
}
// (kept as a separate indirection so this file only imports what it needs from codec.ts)
import { encodeValue as require_encodeValue } from './codec'

// Runs a query and returns ALL matching documents, transparently paginating
// via a `startAfter(__name__)` cursor — Firestore's runQuery response is
// capped (~10MiB/60s per call), so any full-collection scan (the 4 AFE
// export queries, "list all schools", etc.) MUST paginate rather than
// assume one call returns everything.
export async function runQueryAll<T = Record<string, unknown>>(
  env: Env,
  options: QueryOptions,
): Promise<DecodedDocument<T>[]> {
  const pageSize = options.limit ?? 300
  const results: DecodedDocument<T>[] = []
  let cursorName: string | null = null

  for (;;) {
    const orderBy = options.orderBy ?? [{ field: '__name__' as const, direction: 'ASCENDING' as const }]
    const hasNamedOrder = orderBy.some((o) => o.field === '__name__')
    const effectiveOrderBy = hasNamedOrder ? orderBy : [...orderBy, { field: '__name__', direction: 'ASCENDING' as const }]

    const structuredQuery = buildStructuredQuery({
      ...options,
      orderBy: effectiveOrderBy,
      limit: pageSize,
      startAfterValues: cursorName ? [cursorName] : undefined,
    })
    // Cursor must be a full document-reference value when ordering by
    // __name__ — Firestore requires a referenceValue there, not a string.
    if (cursorName) {
      ;(structuredQuery as { startAt?: { values: unknown[] } }).startAt = {
        values: [{ referenceValue: cursorName }],
      }
    }

    const url = `${documentsRoot(env)}:runQuery`
    const rows = await request<Array<{ document?: FirestoreDocumentJSON }>>(env, 'POST', url, { structuredQuery })
    const docs = (rows ?? []).filter((row) => row.document).map((row) => decodeDocument<T>(row.document as FirestoreDocumentJSON))
    results.push(...docs)

    if (docs.length < pageSize) break
    cursorName = docs[docs.length - 1].path
  }

  return results
}

// -- Aggregation (count) --------------------------------------------------

// Uses Firestore's `:runAggregationQuery` — billed at roughly 1 read per
// 1000 index entries scanned rather than 1 read per document, and avoids
// pulling full documents over the wire just to count them. Used by the 40%
// rule's "how many students have already submitted for this school+grade"
// check, which runs on every single submission and must stay cheap.
export async function countDocs(env: Env, options: QueryOptions): Promise<number> {
  const structuredQuery = buildStructuredQuery(options)
  const url = `${documentsRoot(env)}:runAggregationQuery`
  const rows = await request<Array<{ result?: { aggregateFields?: { count?: { integerValue: string } } } }>>(
    env,
    'POST',
    url,
    { structuredAggregationQuery: { structuredQuery, aggregations: [{ alias: 'count', count: {} }] } },
  )
  const count = rows?.[0]?.result?.aggregateFields?.count?.integerValue
  return count ? Number(count) : 0
}

// -- Transactions (commit with retry) ------------------------------------

// The REST API does NOT auto-retry a transaction on ABORTED (contention)
// the way the Admin SDK's `runTransaction` does — this wrapper adds that
// back with capped exponential backoff + jitter. Every multi-document
// atomic write in this codebase (tour-code counter creation, etc.) goes
// through this rather than calling `:commit` directly.
export async function commitWithRetry<T>(env: Env, body: unknown, maxAttempts = 5): Promise<T> {
  let attempt = 0
  let lastError: unknown
  while (attempt < maxAttempts) {
    try {
      const url = `${documentsRoot(env)}:commit`
      return await request<T>(env, 'POST', url, body)
    } catch (error) {
      lastError = error
      const isAborted = error instanceof FirestoreError && (error.status === 409 || error.status === 429)
      if (!isAborted) throw error
      const backoffMs = Math.min(1000, 50 * 2 ** attempt) + Math.random() * 50
      await new Promise((resolve) => setTimeout(resolve, backoffMs))
      attempt += 1
    }
  }
  throw lastError
}

export { decodeFields }
export type { FirestoreFields }
