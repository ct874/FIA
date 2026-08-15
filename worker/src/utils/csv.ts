// Adapted from server/src/utils/csv.js. The original streamed rows to a
// Node `res.write()` socket with `'drain'`-event backpressure handling; a
// Workers `Response` body is a Web Streams `ReadableStream`, not a Node
// stream, so the transport is rewritten — but the row-generation shape
// (`async function*` yielding column-ordered arrays) is unchanged on
// purpose so a true streaming Response is a small follow-up if a school
// count ever makes the in-memory version risky (see afeExport.service.ts's
// doc comment for the sizing rationale: validateAfeOfficialRows() is a
// whole-dataset invariant check that has to see every row before ANY of
// them can be emitted, so buffering the full row set is not a compromise
// here — it's what the original implementation was already effectively
// doing).
export function csvEscapeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function csvRowLine(values: unknown[]): string {
  return `${values.map(csvEscapeCell).join(',')}\r\n`
}

// Builds the full CSV as a single string — UTF-8 BOM first (so Excel opens
// non-ASCII school names correctly), then the header row, then one row per
// entry in `rows`. Uses array-push + one final join, never string
// concatenation in a loop (avoids O(n^2) string-copy behavior on large
// exports).
export function buildCsv(columns: string[], rows: Iterable<unknown[]>): string {
  const parts: string[] = ['﻿' + csvRowLine(columns)]
  for (const row of rows) {
    parts.push(csvRowLine(row))
  }
  return parts.join('')
}
