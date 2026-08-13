import { useMemo, useState } from 'react'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import AlertPopup from '../../../components/ui/AlertPopup'
import TargetSummaryCard from '../components/TargetSummaryCard'
import TargetDistrictCard from '../components/TargetDistrictCard'
import TargetDistrictDetailModal from '../components/TargetDistrictDetailModal'
import SetTargetPasswordModal from '../components/SetTargetPasswordModal'
import SetTargetForm from '../components/SetTargetForm'
import { useTargetProgress } from '../../../hooks/useTargetProgress'
import { useLanguage } from '../../../hooks/useLanguage'

const PRIMARY_BUTTON =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2'
const ACTIVE_SORT_BUTTON = 'rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white'
const INACTIVE_SORT_BUTTON =
  'rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors duration-150 hover:bg-slate-100'

const SORT_KEYS = ['az', 'percent', 'remaining']

function sortDistricts(districts, sortKey) {
  const copy = [...districts]
  if (sortKey === 'percent') return copy.sort((a, b) => b.progressPercent - a.progressPercent)
  if (sortKey === 'remaining') return copy.sort((a, b) => b.remaining - a.remaining)
  return copy.sort((a, b) => a.district.localeCompare(b.district, 'en', { sensitivity: 'base' }))
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out ${
        active ? 'bg-white text-brand-700 shadow-sm shadow-slate-900/10' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

// Super Admin-only district target tracker. Reachable only via ROUTES.TARGETS
// behind the same ProtectedRoute/AdminLayout every other admin page uses —
// Teachers authenticate through a completely separate portal and have no
// path to this route, so the "Set Target" button never needs its own
// visibility check beyond the page-level route guard.
export default function TargetManagementPage() {
  const { t } = useLanguage()
  const { progress, isLoading, error, refetch } = useTargetProgress()
  const [unit, setUnit] = useState('students')
  const [sortKey, setSortKey] = useState('az')
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSavedAlertOpen, setIsSavedAlertOpen] = useState(false)

  const activeStat = progress ? progress[unit] : null
  const sortedDistricts = useMemo(
    () => (activeStat ? sortDistricts(activeStat.districts, sortKey) : []),
    [activeStat, sortKey],
  )

  const detailStats = useMemo(() => {
    if (!selectedDistrict || !progress) return null
    return {
      teacherStat: progress.teachers.districts.find((entry) => entry.district === selectedDistrict),
      studentStat: progress.students.districts.find((entry) => entry.district === selectedDistrict),
    }
  }, [selectedDistrict, progress])

  const handleVerified = () => {
    setIsPasswordModalOpen(false)
    setIsFormOpen(true)
  }

  const handleSaved = () => {
    setIsFormOpen(false)
    setIsSavedAlertOpen(true)
    refetch()
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('targets.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{t('targets.subtitle')}</p>
        </div>
        <button type="button" onClick={() => setIsPasswordModalOpen(true)} className={PRIMARY_BUTTON}>
          {t('targets.setTargetButton')}
        </button>
      </div>

      <div className="mt-5 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
        <TabButton active={unit === 'students'} onClick={() => setUnit('students')}>
          {t('targets.tabs.students')}
        </TabButton>
        <TabButton active={unit === 'teachers'} onClick={() => setUnit('teachers')}>
          {t('targets.tabs.teachers')}
        </TabButton>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <>
          <div className="mt-6">
            <TargetSummaryCard
              unit={unit}
              percent={activeStat.progressPercent}
              target={activeStat.target}
              achieved={activeStat.achieved}
              remaining={activeStat.remaining}
              districtsCovered={progress.districtsCovered}
            />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{t('targets.districtProgress')}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {t('targets.districtsCount', { count: sortedDistricts.length })}
              </span>
              <div className="inline-flex rounded-xl border border-slate-200 p-1">
                {SORT_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSortKey(key)}
                    className={sortKey === key ? ACTIVE_SORT_BUTTON : INACTIVE_SORT_BUTTON}
                  >
                    {t(`targets.sort.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {sortedDistricts.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">{t('targets.noDistricts')}</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedDistricts.map((entry) => (
                <TargetDistrictCard
                  key={entry.district}
                  district={entry.district}
                  percent={entry.progressPercent}
                  target={entry.target}
                  achieved={entry.achieved}
                  remaining={entry.remaining}
                  onClick={() => setSelectedDistrict(entry.district)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <TargetDistrictDetailModal
        isOpen={Boolean(selectedDistrict)}
        onClose={() => setSelectedDistrict(null)}
        district={selectedDistrict}
        teacherStat={detailStats?.teacherStat}
        studentStat={detailStats?.studentStat}
      />

      <SetTargetPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onVerified={handleVerified}
      />

      {isFormOpen && <SetTargetForm onClose={() => setIsFormOpen(false)} onSaved={handleSaved} />}

      <AlertPopup
        isOpen={isSavedAlertOpen}
        onClose={() => setIsSavedAlertOpen(false)}
        variant="success"
        title={t('targets.form.savedTitle')}
      >
        {t('targets.form.savedMessage')}
      </AlertPopup>
    </div>
  )
}
