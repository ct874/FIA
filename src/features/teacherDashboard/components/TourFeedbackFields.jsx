import Select from '../../../components/ui/Select'
import RatingScale from '../../../components/ui/RatingScale'
import TextArea from '../../../components/ui/TextArea'

const LANGUAGE_OPTIONS = [
  { value: 'Hindi', label: 'Hindi' },
  { value: 'English', label: 'English' },
]

export default function TourFeedbackFields({ tour, value, onChange, errors = {} }) {
  const setField = (field) => (fieldValue) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200/80 p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-900">{tour.tourName}</h3>

      <Select
        id={`${tour.tourId}-language`}
        label="In which language did you watch the Career Tour?"
        placeholder="Select a language"
        options={LANGUAGE_OPTIONS}
        value={value.language || ''}
        onChange={(event) => setField('language')(event.target.value)}
        error={errors.language}
      />

      <RatingScale
        label="How likely are you to recommend this tour to other teachers? (0 = Not at all likely, 10 = Extremely likely)"
        min={0}
        max={10}
        value={value.recommendScore ?? null}
        onChange={setField('recommendScore')}
        error={errors.recommendScore}
      />

      <RatingScale
        label="How satisfied are you with the resources provided? (1 = Extremely dissatisfied, 5 = Extremely satisfied)"
        value={value.satisfactionResources ?? null}
        onChange={setField('satisfactionResources')}
        error={errors.satisfactionResources}
      />

      <RatingScale
        label="How easy was it to integrate this tour into your lesson plan? (1 = Extremely difficult, 5 = Extremely easy)"
        value={value.easeIntegration ?? null}
        onChange={setField('easeIntegration')}
        error={errors.easeIntegration}
      />

      <TextArea
        id={`${tour.tourId}-biggestBenefit`}
        label="What was the biggest benefit for your students from this tour?"
        value={value.biggestBenefit || ''}
        onChange={(event) => setField('biggestBenefit')(event.target.value)}
      />

      <TextArea
        id={`${tour.tourId}-improvements`}
        label="What improvements would you suggest for future tours?"
        value={value.improvements || ''}
        onChange={(event) => setField('improvements')(event.target.value)}
      />
    </div>
  )
}
