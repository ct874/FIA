const STORAGE_KEY = 'fia_teacher_submissions'

// Reach-data and feedback forms are dummy/no-backend, but persisting them
// locally makes the Admin "Delete All Feedback & Reach Data" action mean
// something instead of being purely decorative.
export function getTeacherSubmissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addTeacherSubmission(type, payload) {
  const submissions = getTeacherSubmissions()
  submissions.push({ type, payload, submittedAt: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions))
}

export function clearTeacherSubmissions() {
  localStorage.removeItem(STORAGE_KEY)
}
