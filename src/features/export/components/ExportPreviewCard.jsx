import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import TablePagination from '../../../components/table/TablePagination'
import TableFillerRows from '../../../components/table/TableFillerRows'
import { getFillerRowCount } from '../../../components/table/tableRowFiller'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import { useTourCatalog } from '../../../hooks/useTourCatalog'
import { useLanguage } from '../../../hooks/useLanguage'
import { loadProgrammeSetup } from '../utils/programmeSetup'
import {
  STUDENT_FEEDBACK_COLUMNS,
  TEACHER_FEEDBACK_COLUMNS,
  buildFeedbackRows,
  downloadCsv,
  isCellMissing,
} from '../utils/exportFormats'
import { buildDynamicTourCodeMap } from '../utils/exportMappings'
import { fetchAfeOfficialPreview, downloadAfeOfficialCsv, normalizeBlobError } from '../utils/afeOfficialExport'
import { getApiErrorMessage } from '../../../utils/apiErrorMessage'
import { getMonthlyCyclePresets, formatDateForInput, parseDateFromInput } from '../utils/dateRangeCycles'
import { SCHOOL_DATA_CHANGED_EVENT } from '../../../utils/constants'

// Bottom "Export Preview" section reserves visual space for a full page of
// PREVIEW_PAGE_SIZE rows (see TableFillerRows) so the table doesn't visually
// shrink on a short final page — the actual per-tab dataset (and everything
// the CSV/workbook downloads below read from) is always the complete,
// unpaginated rowsByTab/feedbackRowsByTab data; only this on-screen preview
// table is paginated.
const PREVIEW_PAGE_SIZE = 20

const SECONDARY_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 ease-out hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
const TEAL_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-semibold text-white transition-all duration-200 ease-out hover:bg-brand-700 hover:shadow-md hover:shadow-brand-900/20'
const OUTLINE_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 ease-out hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60'
const PRIMARY_CTA_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 ease-out hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-900/25 disabled:cursor-not-allowed disabled:opacity-60'
const PRESET_BUTTON =
  'rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-150 ease-out hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
const DATE_INPUT =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all duration-150 ease-out focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none'

function RefreshIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 12a8 8 0 0114-5.2M20 12a8 8 0 01-14 5.2M4 4v5h5M20 20v-5h-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DownloadIcon({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ExportPreviewCard({ directoryVersion }) {
  const { schools, isLoading, error, refetch } = useSchoolRecords()
  // Only Super-Admin-created tours actually need this — AWS/Robotics/Music
  // (and the dormant AI/Prime placeholders) already resolve through
  // exportMappings.js's fixed CAREER_TOUR_EXPORT_CODE map with no lookup.
  const { tours: tourCatalog } = useTourCatalog()
  const dynamicTourCodeMap = useMemo(() => buildDynamicTourCodeMap(tourCatalog), [tourCatalog])
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('studentFeedback')
  const [range, setRange] = useState({ start: null, end: null })
  const [refreshKey, setRefreshKey] = useState(0)
  const [previewPage, setPreviewPage] = useState(1)

  // The AFE CSV (Official) dataset is entirely backend-generated (school
  // grouping, completion dates, session IDs, validation — see
  // server/src/services/afeExport.service.js) — this component only fetches
  // it for the preview tab / workbook sheet and never re-derives any of it.
  const [afeData, setAfeData] = useState(null)
  const [isAfeLoading, setIsAfeLoading] = useState(true)
  const [afeError, setAfeError] = useState(null)

  // Separate status just for the standalone download button, per the
  // client spec's required "Preparing AFE Official Export..." -> ready
  // messaging.
  const [afeDownloadStatus, setAfeDownloadStatus] = useState('idle') // idle | preparing | ready | error
  const [afeDownloadError, setAfeDownloadError] = useState(null)

  // reportBusy mirrors useSchoolRecords()'s own pattern: an explicit
  // "Refresh" click flips the preview back to a spinner and surfaces
  // errors, while a background reload (directoryVersion changing after an
  // upload/setup-save elsewhere on the page) just swaps in fresh data once
  // ready, without flickering the already-rendered preview.
  const loadAfePreview = useCallback(
    (reportBusy) =>
      fetchAfeOfficialPreview()
        .then((data) => {
          setAfeData(data)
          setAfeError(null)
        })
        .catch((err) => {
          if (reportBusy) setAfeError(getApiErrorMessage(err, t('export.exportPreview.afeLoadError')))
        })
        .finally(() => {
          if (reportBusy) setIsAfeLoading(false)
        }),
    [t],
  )

  useEffect(() => {
    loadAfePreview(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, directoryVersion])

  // useSchoolRecords() (feeding the Student/Teacher Feedback tabs above)
  // already refetches on this event — see hooks/useSchoolRecords.js.
  // updateSchoolExportCodesRequest (a District Code/Postal Code save) also
  // dispatches it, but nothing previously re-fetched the AFE tab's own
  // separate `afeData` copy in response, so a just-saved code kept showing
  // its old value in this preview (and in the "AFE CSV"/"Download All"
  // download buttons' in-memory data, though the actual file downloads
  // were already always fresh since they re-fetch on click) until a manual
  // "Refresh" click or a full page reload. A background refresh here
  // (reportBusy=false) never flickers the already-rendered preview.
  useEffect(() => {
    const handleDataChanged = () => loadAfePreview(false)
    window.addEventListener(SCHOOL_DATA_CHANGED_EVENT, handleDataChanged)
    return () => window.removeEventListener(SCHOOL_DATA_CHANGED_EVENT, handleDataChanged)
  }, [loadAfePreview])

  const TABS = [
    { key: 'studentFeedback', label: t('export.exportPreview.tabs.studentFeedback') },
    { key: 'teacherFeedback', label: t('export.exportPreview.tabs.teacherFeedback') },
    { key: 'afe', label: t('export.exportPreview.tabs.afe') },
  ]

  const setup = useMemo(
    () => loadProgrammeSetup(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey, directoryVersion],
  )
  const presets = useMemo(() => getMonthlyCyclePresets(6), [])

  const feedbackRowsByTab = useMemo(() => {
    if (isLoading) return { studentFeedback: [], teacherFeedback: [] }
    return {
      studentFeedback: buildFeedbackRows(schools, setup, 'student', range, dynamicTourCodeMap),
      teacherFeedback: buildFeedbackRows(schools, setup, 'teacher', range, dynamicTourCodeMap),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schools, setup, range, refreshKey, isLoading, dynamicTourCodeMap])

  const afeColumns = afeData?.columns ?? []
  const afeRows = afeData?.rows ?? []

  const rowsByTab = { ...feedbackRowsByTab, afe: afeRows }
  const columnsByTab = {
    studentFeedback: STUDENT_FEEDBACK_COLUMNS,
    teacherFeedback: TEACHER_FEEDBACK_COLUMNS,
    afe: afeColumns,
  }

  const activeRows = rowsByTab[activeTab]
  const activeColumns = columnsByTab[activeTab]
  const previewTotalPages = Math.max(1, Math.ceil(activeRows.length / PREVIEW_PAGE_SIZE))
  const previewCurrentPage = Math.min(previewPage, previewTotalPages)
  const previewRows = activeRows.slice(
    (previewCurrentPage - 1) * PREVIEW_PAGE_SIZE,
    previewCurrentPage * PREVIEW_PAGE_SIZE,
  )

  const handleRefresh = () => {
    setRefreshKey((key) => key + 1)
    setIsAfeLoading(true)
    setPreviewPage(1)
    refetch()
  }

  // Switching tabs / changing the date range swaps in a different dataset —
  // reset back to page 1 so the preview never lands on a now out-of-range
  // page, same as DashboardTable resets to page 1 on search.
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    setPreviewPage(1)
  }

  const handleRangeChange = (updater) => {
    setRange(updater)
    setPreviewPage(1)
  }

  const handleDownload = (key, columns, filenamePrefix) => {
    downloadCsv(`${filenamePrefix}.csv`, columns, rowsByTab[key])
  }

  const handleDownloadAfeOfficial = async () => {
    setAfeDownloadStatus('preparing')
    setAfeDownloadError(null)
    try {
      await downloadAfeOfficialCsv()
      setAfeDownloadStatus('ready')
      setTimeout(() => setAfeDownloadStatus('idle'), 2500)
    } catch (err) {
      setAfeDownloadStatus('error')
      setAfeDownloadError(getApiErrorMessage(err, t('export.exportPreview.afeDownloadError')))
    }
  }

  // The final exported workbook — exactly 3 sheets (Teacher Feedback,
  // Student Feedback, AFE CSV), in that order, no other sheet. The AFE sheet
  // always fetches a fresh copy from the backend so the workbook can never
  // ship a stale AFE dataset alongside current Feedback sheets.
  const handleDownloadWorkbook = async () => {
    setAfeDownloadStatus('preparing')
    setAfeDownloadError(null)
    try {
      const freshAfeData = await fetchAfeOfficialPreview()
      const workbook = XLSX.utils.book_new()
      ;[
        { name: 'Teacher Feedback', columns: TEACHER_FEEDBACK_COLUMNS, rows: feedbackRowsByTab.teacherFeedback },
        { name: 'Student Feedback', columns: STUDENT_FEEDBACK_COLUMNS, rows: feedbackRowsByTab.studentFeedback },
        { name: 'AFE CSV', columns: freshAfeData.columns, rows: freshAfeData.rows },
      ].forEach(({ name, columns, rows }) => {
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns })
        XLSX.utils.book_append_sheet(workbook, worksheet, name)
      })
      XLSX.writeFile(workbook, 'fia-export.xlsx')
      setAfeDownloadStatus('ready')
      setTimeout(() => setAfeDownloadStatus('idle'), 2500)
    } catch (err) {
      setAfeDownloadStatus('error')
      const normalized = await normalizeBlobError(err)
      setAfeDownloadError(getApiErrorMessage(normalized, t('export.exportPreview.afeDownloadError')))
    }
  }

  const hasActiveRange = Boolean(range.start || range.end)
  const isPreviewTableVisible =
    activeTab === 'afe' ? !isAfeLoading && !afeError : !isLoading && !error

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t('export.exportPreview.title')}</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          {t('export.exportPreview.description')}{' '}
          <span className="font-medium text-accent-700">{t('export.exportPreview.missingFieldNote')}</span>
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleRefresh} className={SECONDARY_BUTTON}>
          <RefreshIcon /> {t('export.exportPreview.refresh')}
        </button>
        <button
          type="button"
          onClick={() => handleDownload('studentFeedback', STUDENT_FEEDBACK_COLUMNS, 'fia-student-feedback')}
          className={TEAL_BUTTON}
        >
          <DownloadIcon /> {t('export.exportPreview.studentFeedbackCsv')}
        </button>
        <button
          type="button"
          onClick={() => handleDownload('teacherFeedback', TEACHER_FEEDBACK_COLUMNS, 'fia-teacher-feedback')}
          className={TEAL_BUTTON}
        >
          <DownloadIcon /> {t('export.exportPreview.teacherFeedbackCsv')}
        </button>
        <button
          type="button"
          onClick={handleDownloadAfeOfficial}
          disabled={afeDownloadStatus === 'preparing'}
          className={OUTLINE_BUTTON}
        >
          <DownloadIcon /> {t('export.exportPreview.afeCsv')}
        </button>
        <button
          type="button"
          onClick={handleDownloadWorkbook}
          disabled={afeDownloadStatus === 'preparing'}
          className={PRIMARY_CTA_BUTTON}
        >
          <DownloadIcon className="h-4 w-4" /> {t('export.exportPreview.downloadAll')}
        </button>

        {afeDownloadStatus === 'preparing' && (
          <span className="text-xs font-medium text-slate-500">{t('export.exportPreview.afePreparing')}</span>
        )}
        {afeDownloadStatus === 'ready' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            {t('export.exportPreview.afeReady')}
          </span>
        )}
        {afeDownloadStatus === 'error' && (
          <span className="text-xs font-medium text-red-600">{afeDownloadError}</span>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {t('export.exportPreview.dateRangeFilter')}
          </span>
          <span className="text-xs text-slate-400">{t('export.exportPreview.cycleLabel')}</span>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="rangeFrom" className="mb-1 block text-xs text-slate-500">
              {t('export.exportPreview.from')}
            </label>
            <input
              id="rangeFrom"
              type="date"
              value={formatDateForInput(range.start)}
              onChange={(event) =>
                handleRangeChange((prev) => ({ ...prev, start: parseDateFromInput(event.target.value) }))
              }
              className={DATE_INPUT}
            />
          </div>
          <div>
            <label htmlFor="rangeTo" className="mb-1 block text-xs text-slate-500">
              {t('export.exportPreview.to')}
            </label>
            <input
              id="rangeTo"
              type="date"
              value={formatDateForInput(range.end)}
              onChange={(event) =>
                handleRangeChange((prev) => ({ ...prev, end: parseDateFromInput(event.target.value) }))
              }
              className={DATE_INPUT}
            />
          </div>

          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleRangeChange({ start: preset.start, end: preset.end })}
              className={PRESET_BUTTON}
            >
              {preset.label}
            </button>
          ))}

          {hasActiveRange && (
            <button
              type="button"
              onClick={() => handleRangeChange({ start: null, end: null })}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-800"
            >
              {t('export.exportPreview.clear')}
            </button>
          )}
        </div>
        {activeTab === 'afe' && (
          <p className="mt-2 text-xs text-slate-400">{t('export.exportPreview.afeIgnoresDateFilter')}</p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleTabChange(tab.key)}
            className={`-mb-px rounded-t-xl border-b-2 px-4 py-2 text-sm font-medium transition-all duration-150 ease-out ${
              activeTab === tab.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {activeRows.length === 1
          ? t('export.exportPreview.rowCount', { count: activeRows.length })
          : t('export.exportPreview.rowCountPlural', { count: activeRows.length })}
      </p>

      {activeTab === 'afe' && isAfeLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : activeTab === 'afe' && afeError ? (
        <ErrorState message={afeError} onRetry={() => loadAfePreview(true)} />
      ) : activeTab !== 'afe' && isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : activeTab !== 'afe' && error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-50">
              <tr>
                {activeColumns.map((column) => (
                  <th
                    key={column}
                    className="border-b border-slate-200 px-3 py-2 font-semibold whitespace-nowrap text-slate-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 transition-colors duration-150 hover:bg-brand-50/50"
                >
                  {activeColumns.map((column) => {
                    // The AFE (Official) format intentionally leaves many
                    // cells blank (see server/src/constants/afeOfficialColumns.js)
                    // — the amber "missing field" highlight only applies to
                    // the Student/Teacher Feedback tabs' required columns.
                    const missing = activeTab !== 'afe' && isCellMissing(column, row[column])
                    return (
                      <td
                        key={column}
                        className={`px-3 py-2 whitespace-nowrap ${
                          missing ? 'bg-amber-100 font-medium text-amber-700' : 'text-slate-700'
                        }`}
                      >
                        {missing ? t('export.exportPreview.missingCell') : String(row[column] ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {previewRows.length === 0 && (
                <tr>
                  <td colSpan={activeColumns.length} className="px-3 py-10 text-center text-slate-400">
                    {t('export.exportPreview.noRows')}
                  </td>
                </tr>
              )}

              <TableFillerRows
                count={getFillerRowCount(previewRows.length, PREVIEW_PAGE_SIZE)}
                colSpan={activeColumns.length}
                cellClassName="px-3 py-2"
              />
            </tbody>
          </table>
        </div>
      )}

      {isPreviewTableVisible && (
        <TablePagination
          page={previewCurrentPage}
          totalPages={previewTotalPages}
          totalItems={activeRows.length}
          pageSize={PREVIEW_PAGE_SIZE}
          onPageChange={setPreviewPage}
        />
      )}
    </section>
  )
}
