export const GRADES = Array.from({ length: 12 }, (_, index) => String(index + 1))

export const LANGUAGES = ['Hindi', 'English']

// Student Feedback target: forms expected per grade = ceil(uniqueStudentCount * rate)
export const STUDENT_FEEDBACK_TARGET_RATE = 0.4
