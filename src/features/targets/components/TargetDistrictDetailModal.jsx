import Modal from '../../../components/ui/Modal'
import { useLanguage } from '../../../hooks/useLanguage'

function UnitBlock({ title, stat }) {
  const { t } = useLanguage()
  const clampedPercent = Math.min(100, Math.max(0, stat.progressPercent))

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-sm font-semibold text-blue-600">{stat.progressPercent}%</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${clampedPercent}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">{stat.target.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase">
            {t('targets.summary.target')}
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold text-blue-600">{stat.achieved.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase">
            {t('targets.summary.achieved')}
          </p>
        </div>
        <div>
          <p className="text-lg font-semibold text-amber-600">{stat.remaining.toLocaleString()}</p>
          <p className="mt-0.5 text-[10px] font-medium tracking-wide text-slate-400 uppercase">
            {t('targets.summary.remaining')}
          </p>
        </div>
      </div>

      {stat.target === 0 && (
        <p className="mt-3 text-xs font-medium text-amber-600">{t('targets.district.noTargetConfigured')}</p>
      )}
    </div>
  )
}

// Live Teacher + Student breakdown for one district — both units are already
// present in the progress response (progress.teachers.districts /
// progress.students.districts), so opening this needs no extra request.
export default function TargetDistrictDetailModal({ isOpen, onClose, district, teacherStat, studentStat }) {
  const { t } = useLanguage()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
          {t('targets.detail.districtLabel')}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">{district}</h2>

        {teacherStat && studentStat && (
          <div className="mt-6 space-y-4">
            <UnitBlock title={t('targets.tabs.teachers')} stat={teacherStat} />
            <UnitBlock title={t('targets.tabs.students')} stat={studentStat} />
          </div>
        )}
      </div>
    </Modal>
  )
}
