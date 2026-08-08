// Minimal, dependency-free CSV writer built for STREAMING a response —
// large exports (server/src/services/afeExport.service.js) must never build
// one giant in-memory string, per the performance requirement that big
// exports can't freeze the browser or the server.

// RFC 4180-style escaping: wrap in quotes if the value contains a comma,
// quote, or newline; double up any internal quotes. `null`/`undefined`
// become an empty cell (never the string "null"/"undefined") — required
// for the AFE export's many intentionally-blank columns.
export function csvEscapeCell(value) {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function csvRowLine(values) {
  return `${values.map(csvEscapeCell).join(',')}\r\n`
}

// Streams `columns` as the header line, then one CSV line per entry
// yielded by `rowsIterable` (a sync or async iterable of column-ordered
// value arrays). A leading UTF-8 BOM is written first so Excel opens the
// file with correct encoding instead of mojibake-ing non-ASCII school
// names. Backpressure-aware: waits for `res.write()`'s drain event before
// pulling the next row when the socket buffer is full, so a very large
// export can't balloon server memory.
export async function streamCsv(res, columns, rowsIterable) {
  await writeWithBackpressure(res, '﻿' + csvRowLine(columns))
  for await (const row of rowsIterable) {
    await writeWithBackpressure(res, csvRowLine(row))
  }
}

function writeWithBackpressure(res, chunk) {
  return new Promise((resolve, reject) => {
    const canContinue = res.write(chunk, (err) => {
      if (err) reject(err)
    })
    if (canContinue) {
      resolve()
    } else {
      res.once('drain', resolve)
      res.once('error', reject)
    }
  })
}
