import { useState } from 'react'
import Select from '../../../components/ui/Select'
import RatingScale from '../../../components/ui/RatingScale'
import TextArea from '../../../components/ui/TextArea'
import Button from '../../../components/ui/Button'
import { useTeacherAuth } from '../../../hooks/useTeacherAuth'
import { TOURS } from '../../../data/schoolRecords.schema'
import { addTeacherSubmission } from '../../../services/teacherSubmissions.service'

const TOUR_OPTIONS = Object.values(TOURS).map((tour) => ({ value: tour.id, label: tour.name }))
const LANGUAGE_OPTIONS = [
  { value: 'Hindi', label: 'Hindi' },
  { value: 'English', label: 'English' },
]

const INITIAL_FORM = {
  tourId: '',
  language: '',
  enjoyment: null,
  overallExperience: null,
  itp: null,
  wantExploreCareer: null,
  wantMoreTours: null,
  nps: null,
  satisfactionResources: null,
  easeIntegration: null,
  biggestBenefit: '',
  improvements: '',
}

function YesNoToggle({ label, value, onChange }) {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="inline-flex overflow-hidden rounded-xl border border-slate-200">
        {[
          { label: 'Yes', val: true },
          { label: 'No', val: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.val)}
            className={`px-5 py-2 text-sm font-semibold transition-all duration-150 ease-out ${
              value === option.val
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function TeacherFeedbackPage() {
  const { teacher } = useTeacherAuth()
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const setField = (field) => (value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = () => {
    const required = [
      'tourId', 'language', 'enjoyment', 'overallExperience', 'itp',
      'wantExploreCareer', 'wantMoreTours', 'nps', 'satisfactionResources', 'easeIntegration',
    ]
    const nextErrors = {}
    required.forEach((field) => {
      if (form[field] === null || form[field] === '') nextErrors[field] = 'Required'
    })
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const tour = Object.values(TOURS).find((item) => item.id === form.tourId)

    // Shaped exactly like a canonical TourEntry.teacherFeedback entry (see
    // src/data/schoolRecords.schema.js) so wiring this up to a real POST
    // endpoint later is a straight swap. `nps` here is the raw 0-10 rating;
    // the classroom-aggregate NPS % (PDF formula) is computed once multiple
    // submissions roll in on the backend.
    const payload = {
      udise: teacher.udise,
      schoolName: teacher.schoolName,
      tourId: tour.id,
      tourName: tour.name,
      language: form.language,
      teacherFeedback: {
        submittedBy: teacher.schoolName,
        enjoyment: form.enjoyment,
        overallExperience: form.overallExperience,
        itp: form.itp,
        wantExploreCareer: form.wantExploreCareer,
        wantMoreTours: form.wantMoreTours,
        recommendScore: form.nps,
        satisfactionResources: form.satisfactionResources,
        easeIntegration: form.easeIntegration,
        biggestBenefit: form.biggestBenefit.trim(),
        improvements: form.improvements.trim(),
      },
    }
    // TODO: replace with a real API call, e.g. axiosClient.post('/teacher/feedback', payload)
    console.log('Teacher feedback submitted (dummy, no backend yet):', payload)
    addTeacherSubmission('feedback', payload)

    setSubmitted(true)
    setForm(INITIAL_FORM)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Teacher Feedback</h1>
        <p className="mt-1 text-sm text-slate-500">
          Share your experience running a Career Tour session.
        </p>
      </div>

      {submitted && (
        <div
          role="status"
          className="mb-6 animate-fade-in-up rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
        >
          Thank you — your feedback has been recorded.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8"
      >
        <Select
          id="tourId"
          label="Which Career Tour are you giving feedback on?"
          placeholder="Select a Career Tour"
          options={TOUR_OPTIONS}
          value={form.tourId}
          onChange={(event) => setField('tourId')(event.target.value)}
          error={errors.tourId && 'Please select a tour.'}
        />

        <Select
          id="language"
          label="In which language did you watch the Career Tour?"
          placeholder="Select a language"
          options={LANGUAGE_OPTIONS}
          value={form.language}
          onChange={(event) => setField('language')(event.target.value)}
          error={errors.language && 'Please select a language.'}
        />

        <RatingScale
          label="How much did you enjoy this Career Tour? (1 = Didn't like it at all, 5 = Loved it)"
          value={form.enjoyment}
          onChange={setField('enjoyment')}
          error={errors.enjoyment && 'Please choose a rating.'}
        />

        <RatingScale
          label="Please rate your overall experience of the tour (1 = Very Poor, 5 = Excellent)"
          value={form.overallExperience}
          onChange={setField('overallExperience')}
          error={errors.overallExperience && 'Please choose a rating.'}
        />

        <RatingScale
          label="How interested are your students in learning more about careers of the future? (1 = Not at all, 5 = Very interested)"
          value={form.itp}
          onChange={setField('itp')}
          error={errors.itp && 'Please choose a rating.'}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <YesNoToggle
            label="Did the tour make students want to explore a career of the future?"
            value={form.wantExploreCareer}
            onChange={setField('wantExploreCareer')}
          />
          <YesNoToggle
            label="Would you like to see more tours like this?"
            value={form.wantMoreTours}
            onChange={setField('wantMoreTours')}
          />
        </div>

        <RatingScale
          label="How likely are you to recommend this tour to other teachers/schools? (0 = Not at all likely, 10 = Extremely likely)"
          min={0}
          max={10}
          value={form.nps}
          onChange={setField('nps')}
          error={errors.nps && 'Please choose a rating.'}
        />

        <RatingScale
          label="How satisfied are you with the resources provided (Teacher Toolkit, worksheets, facilitation guide)? (1 = Extremely dissatisfied, 5 = Extremely satisfied)"
          value={form.satisfactionResources}
          onChange={setField('satisfactionResources')}
          error={errors.satisfactionResources && 'Please choose a rating.'}
        />

        <RatingScale
          label="How easy was it to integrate this tour into your classroom lesson plan? (1 = Extremely difficult, 5 = Extremely easy)"
          value={form.easeIntegration}
          onChange={setField('easeIntegration')}
          error={errors.easeIntegration && 'Please choose a rating.'}
        />

        <TextArea
          id="biggestBenefit"
          label="What was the biggest benefit for your students from this tour?"
          value={form.biggestBenefit}
          onChange={(event) => setField('biggestBenefit')(event.target.value)}
        />

        <TextArea
          id="improvements"
          label="What improvements would you suggest for future tours?"
          value={form.improvements}
          onChange={(event) => setField('improvements')(event.target.value)}
        />

        <Button type="submit">Submit Feedback</Button>
      </form>
    </div>
  )
}
