// Reserves a consistent visual row-count/height for paginated tables so a
// short final page (e.g. "Showing 51-51 of 51") doesn't visually shrink the
// table container compared to a full page. Purely cosmetic: these rows carry
// no data, are hidden from assistive tech, ignore pointer/selection
// interaction, and never affect the real row count, pagination math, exports,
// or API calls — only the actual rows above them are real records.
export default function TableFillerRows({ count, colSpan, cellClassName = 'px-4 py-3' }) {
  if (count <= 0) return null

  return Array.from({ length: count }, (_, index) => (
    <tr key={`__filler-${index}`} aria-hidden="true" className="pointer-events-none select-none">
      <td colSpan={colSpan} className={cellClassName}>
        &nbsp;
      </td>
    </tr>
  ))
}
