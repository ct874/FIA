// Shared by TableFillerRows.jsx — kept in its own module (rather than
// co-exported from that component file) purely to satisfy the
// react-refresh/only-export-components rule.
//
// A single empty-state row (rendered by the caller when there are zero real
// rows) counts as occupying one of the reserved slots, so the total rendered
// row count still lines up with `pageSize` rather than reserving an extra
// full page's worth of blank rows underneath the empty-state message.
export function getFillerRowCount(visibleRowCount, pageSize) {
  const rowSlotsUsed = visibleRowCount > 0 ? visibleRowCount : 1
  return Math.max(0, pageSize - rowSlotsUsed)
}
