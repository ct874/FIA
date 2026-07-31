import { useState } from 'react'
import TextInput from '../../../components/ui/TextInput'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'
import { useTeacherAuth } from '../../../hooks/useTeacherAuth'
import { TOURS } from '../../../data/schoolRecords.schema'
import { addTeacherSubmission } from '../../../services/teacherSubmissions.service'

const TOUR_OPTIONS = Object.values(TOURS).map((tour) => ({ value: tour.id, label: tour.name }))
const LANGUAGE_OPTIONS = [
  { value: 'Hindi', label: 'Hindi' },
  { value: 'English', label: 'English' },
]
const MONTH_OPTIONS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
].map((month) => ({ value: month, label: month }))

const INITIAL_FORM = {
  grade: '',
  classSection: '',
  tourId: '',
  language: '',
  month: '',
  studentsReached: '',
  uniqueStudentCount: '',
}

export default function ReachDataPage() {
  const { teacher } = useTeacherAuth()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submittedSummary, setSubmittedSummary] = useState(null)

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!form.grade.trim()) nextErrors.grade = 'Grade is required.'
    if (!form.tourId) nextErrors.tourId = 'Please select a Career Tour.'
    if (!form.language) nextErrors.language = 'Please select a language.'
    if (!form.month) nextErrors.month = 'Please select a month.'
    if (!form.studentsReached || Number(form.studentsReached) <= 0) {
      nextErrors.studentsReached = 'Enter the number of students reached.'
    }
    if (!form.uniqueStudentCount || Number(form.uniqueStudentCount) <= 0) {
      nextErrors.uniqueStudentCount = 'Enter the total unique student count.'
    }
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const tour = Object.values(TOURS).find((item) => item.id === form.tourId)

    // Shaped exactly like a canonical TourEntry.reach entry (see
    // src/data/schoolRecords.schema.js) so wiring this up to a real POST
    // endpoint later is a straight swap.
    const payload = {
      udise: teacher.udise,
      schoolName: teacher.schoolName,
      grade: form.grade.trim(),
      section: form.classSection.trim(),
      tourId: tour.id,
      tourName: tour.name,
      month: form.month,
      language: form.language,
      reach: {
        studentsReached: Number(form.studentsReached),
        uniqueStudentCount: Number(form.uniqueStudentCount),
      },
    }
    // TODO: replace with a real API call, e.g. axiosClient.post('/teacher/reach-data', payload)
    console.log('Reach data submitted (dummy, no backend yet):', payload)
    addTeacherSubmission('reach', payload)

    setSubmittedSummary(payload)
    setForm(INITIAL_FORM)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Student Reach Data</h1>
        <p className="mt-1 text-sm text-slate-500">
          Log how many students watched each Career Tour video in your class.
        </p>
      </div>

      {submittedSummary && (
        <div
          role="status"
          className="mb-6 animate-fade-in-up rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          Reach data saved for Grade {submittedSummary.grade} · {submittedSummary.tourName} (
          {submittedSummary.reach.uniqueStudentCount} unique students).
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            id="grade"
            label="Grade"
            placeholder="e.g. 8"
            value={form.grade}
            onChange={handleChange('grade')}
            error={errors.grade}
          />
          <TextInput
            id="classSection"
            label="Class Section (optional)"
            placeholder="e.g. A"
            value={form.classSection}
            onChange={handleChange('classSection')}
          />
        </div>

        <Select
          id="tourId"
          label="Which career tour did you attend?"
          placeholder="Select a Career Tour"
          options={TOUR_OPTIONS}
          value={form.tourId}
          onChange={handleChange('tourId')}
          error={errors.tourId}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="language"
            label="Language watched in"
            placeholder="Select a language"
            options={LANGUAGE_OPTIONS}
            value={form.language}
            onChange={handleChange('language')}
            error={errors.language}
          />
          <Select
            id="month"
            label="Month"
            placeholder="Select a month"
            options={MONTH_OPTIONS}
            value={form.month}
            onChange={handleChange('month')}
            error={errors.month}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextInput
            id="studentsReached"
            label="No. of Students Reached"
            type="number"
            min="0"
            value={form.studentsReached}
            onChange={handleChange('studentsReached')}
            error={errors.studentsReached}
          />
          <TextInput
            id="uniqueStudentCount"
            label="Total Unique Student Count"
            type="number"
            min="0"
            value={form.uniqueStudentCount}
            onChange={handleChange('uniqueStudentCount')}
            error={errors.uniqueStudentCount}
          />
        </div>

        <Button type="submit">Submit Reach Data</Button>
      </form>
    </div>
  )
}
