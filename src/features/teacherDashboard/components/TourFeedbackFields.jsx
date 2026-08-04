import Select from '../../../components/ui/Select'
import RatingScale from '../../../components/ui/RatingScale'
import TextArea from '../../../components/ui/TextArea'
import { useLanguage } from '../../../hooks/useLanguage'

export default function TourFeedbackFields({ tour, value, onChange, errors = {} }) {
  const { t } = useLanguage()

  const LANGUAGE_OPTIONS = [
    { value: 'Hindi', label: 'Hindi' },
    { value: 'English', label: 'English' },
  ]

  const setField = (field) => (fieldValue) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200/80 p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-slate-900">{tour.tourName}</h3>

      <Select
        id={`${tour.tourId}-language`}
        label={t('tourFeedbackFields.languageQuestion')}
        placeholder={t('tourFeedbackFields.languagePlaceholder')}
        options={LANGUAGE_OPTIONS}
        value={value.language || ''}
        onChange={(event) => setField('language')(event.target.value)}
        error={errors.language}
      />

      <RatingScale
        label={t('tourFeedbackFields.recommendQuestion')}
        min={0}
        max={10}
        value={value.recommendScore ?? null}
        onChange={setField('recommendScore')}
        error={errors.recommendScore}
      />

      <RatingScale
        label={t('tourFeedbackFields.satisfactionQuestion')}
        value={value.satisfactionResources ?? null}
        onChange={setField('satisfactionResources')}
        error={errors.satisfactionResources}
      />

      <RatingScale
        label={t('tourFeedbackFields.easeQuestion')}
        value={value.easeIntegration ?? null}
        onChange={setField('easeIntegration')}
        error={errors.easeIntegration}
      />

      <TextArea
        id={`${tour.tourId}-biggestBenefit`}
        label={t('tourFeedbackFields.biggestBenefitQuestion')}
        value={value.biggestBenefit || ''}
        onChange={(event) => setField('biggestBenefit')(event.target.value)}
      />

      <TextArea
        id={`${tour.tourId}-improvements`}
        label={t('tourFeedbackFields.improvementsQuestion')}
        value={value.improvements || ''}
        onChange={(event) => setField('improvements')(event.target.value)}
      />
    </div>
  )
}
