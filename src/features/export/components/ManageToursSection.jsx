import { useState } from 'react'
import AddTourModal from './AddTourModal'
import DeleteTourModal from './DeleteTourModal'
import { useTourCatalog } from '../../../hooks/useTourCatalog'
import { useLanguage } from '../../../hooks/useLanguage'

const PRIMARY_BUTTON =
  'inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ease-out hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/20'
const OUTLINE_BUTTON =
  'inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 ease-out hover:border-red-600 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-600/20'

// Programme Setup's Tour Management block — Add/Delete only, no Edit
// option anywhere (per the strict "no rename/re-configure existing tours"
// requirement). The list below is the live tour catalog (see
// useTourCatalog()) — the same source of truth every other tour-aware part
// of the portal (feedback flow, exports, dashboard) already reads from.
export default function ManageToursSection() {
  const { t } = useLanguage()
  const { tours, isLoading, error, refetch } = useTourCatalog()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [message, setMessage] = useState('')

  const handleCreated = () => {
    setMessage(t('export.tourManagement.createSuccess'))
    refetch()
  }

  const handleDeleted = () => {
    setMessage(t('export.tourManagement.deleteSuccess'))
    refetch()
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {t('export.tourManagement.title')}
          </p>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{t('export.tourManagement.description')}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setIsAddOpen(true)} className={PRIMARY_BUTTON}>
            {t('export.tourManagement.addTour')}
          </button>
          <button type="button" onClick={() => setIsDeleteOpen(true)} className={OUTLINE_BUTTON}>
            {t('export.tourManagement.deleteTour')}
          </button>
        </div>
      </div>

      {message && <p className="mt-3 animate-fade-in-up text-xs font-medium text-green-600">{message}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-500">
                {t('export.tourManagement.idLabel')}
              </th>
              <th className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-500">
                {t('export.tourManagement.addForm.tourName')}
              </th>
              <th className="border-b border-slate-200 px-4 py-2 font-semibold text-slate-500">
                {t('export.programmeSetup.sessionDuration')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  …
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : tours.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  {t('export.tourManagement.empty')}
                </td>
              </tr>
            ) : (
              tours.map((tour) => (
                <tr
                  key={tour.tourId}
                  className="odd:bg-white even:bg-slate-50/60 transition-colors duration-150 hover:bg-brand-50/50"
                >
                  <td className="border-b border-slate-100 px-4 py-2 text-slate-700">{tour.code}</td>
                  <td className="border-b border-slate-100 px-4 py-2 text-slate-700">{tour.tourName}</td>
                  <td className="border-b border-slate-100 px-4 py-2 text-slate-700">
                    {t('export.tourManagement.durationLabel', { minutes: tour.durationMinutes })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddTourModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onCreated={handleCreated} />
      <DeleteTourModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        tours={tours}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
