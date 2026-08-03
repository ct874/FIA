import { useMemo, useState } from 'react'
import Spinner from '../../../components/ui/Spinner'
import ErrorState from '../../../components/ui/ErrorState'
import { useSchoolRecords } from '../../../hooks/useSchoolRecords'
import { loadProgrammeSetup } from '../utils/programmeSetup'
import {
  STUDENT_REACH_COLUMNS,
  FEEDBACK_COLUMNS,
  AFE_COLUMNS,
  buildStudentReachRows,
  buildFeedbackRows,
  buildAfeRows,
  downloadCsv,
  isCellMissing,
} from '../utils/exportFormats'
import { getMonthlyCyclePresets, formatDateForInput, parseDateFromInput } from '../utils/dateRangeCycles'

const TABS = [
  { key: 'reach', label: 'Student Reach' },
  { key: 'studentFeedback', label: 'Student Feedback' },
  { key: 'teacherFeedback', label: 'Teacher Feedback' },
  { key: 'afe', label: 'AFE (Official)' },
]

const PREVIEW_LIMIT = 50

const SECONDARY_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all duration-200 ease-out hover:bg-slate-100'
const TEAL_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition-all duration-200 ease-out hover:bg-teal-800 hover:shadow-md hover:shadow-teal-700/20'
const NAVY_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-all duration-200 ease-out hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/20'
const AMBER_BUTTON =
  'inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white transition-all duration-200 ease-out hover:bg-amber-600 hover:shadow-md hover:shadow-amber-500/30'
const PRESET_BUTTON =
  'rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-150 ease-out hover:bg-slate-100'
const DATE_INPUT =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-all duration-150 ease-out focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none'

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

export default function ExportPreviewCard({ directoryVersion }) {
  const { schools, isLoading, error, refetch } = useSchoolRecords()
  const [activeTab, setActiveTab] = useState('studentFeedback')
  const [range, setRange] = useState({ start: null, end: null })
  const [refreshKey, setRefreshKey] = useState(0)

  const setup = useMemo(
    () => loadProgrammeSetup(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshKey, directoryVersion],
  )
  const presets = useMemo(() => getMonthlyCyclePresets(6), [])

  const rowsByTab = useMemo(() => {
    if (isLoading) return { reach: [], studentFeedback: [], teacherFeedback: [], afe: [] }
    return {
      reach: buildStudentReachRows(schools, setup, range),
      studentFeedback: buildFeedbackRows(schools, setup, 'student', range),
      teacherFeedback: buildFeedbackRows(schools, setup, 'teacher', range),
      afe: buildAfeRows(schools, setup, range),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schools, setup, range, refreshKey, isLoading])

  const columnsByTab = {
    reach: STUDENT_REACH_COLUMNS,
    studentFeedback: FEEDBACK_COLUMNS,
    teacherFeedback: FEEDBACK_COLUMNS,
    afe: AFE_COLUMNS,
  }

  const activeRows = rowsByTab[activeTab]
  const activeColumns = columnsByTab[activeTab]
  const previewRows = activeRows.slice(0, PREVIEW_LIMIT)

  const handleDownload = (key, columns, filenamePrefix) => {
    downloadCsv(`${filenamePrefix}.csv`, columns, rowsByTab[key])
  }

  const handleDownloadAll = () => {
    handleDownload('reach', STUDENT_REACH_COLUMNS, 'fia-student-reach')
    handleDownload('studentFeedback', FEEDBACK_COLUMNS, 'fia-student-feedback')
    handleDownload('teacherFeedback', FEEDBACK_COLUMNS, 'fia-teacher-feedback')
    handleDownload('afe', AFE_COLUMNS, 'fia-afe-official')
  }

  const hasActiveRange = Boolean(range.start || range.end)

  return (
    <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Export Preview</h2>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          Live preview in the exact export format.{' '}
          <span className="font-medium text-amber-600">⚠ Yellow = missing field</span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className={SECONDARY_BUTTON}>
          <RefreshIcon /> Refresh
        </button>
        <button
          type="button"
          onClick={() => handleDownload('reach', STUDENT_REACH_COLUMNS, 'fia-student-reach')}
          className={TEAL_BUTTON}
        >
          Student Reach CSV (Form 1)
        </button>
        <button
          type="button"
          onClick={() => handleDownload('studentFeedback', FEEDBACK_COLUMNS, 'fia-student-feedback')}
          className={TEAL_BUTTON}
        >
          Student Feedback CSV (Form 2)
        </button>
        <button
          type="button"
          onClick={() => handleDownload('teacherFeedback', FEEDBACK_COLUMNS, 'fia-teacher-feedback')}
          className={TEAL_BUTTON}
        >
          Teacher Feedback CSV (Form 2)
        </button>
        <button
          type="button"
          onClick={() => handleDownload('afe', AFE_COLUMNS, 'fia-afe-official')}
          className={NAVY_BUTTON}
        >
          AFE CSV (Official)
        </button>
        <button type="button" onClick={handleDownloadAll} className={AMBER_BUTTON}>
          Download All Files
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Date Range Filter</span>
          <span className="text-xs text-slate-400">Cycle: 5th → 4th</span>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="rangeFrom" className="mb-1 block text-xs text-slate-500">
              From
            </label>
            <input
              id="rangeFrom"
              type="date"
              value={formatDateForInput(range.start)}
              onChange={(event) =>
                setRange((prev) => ({ ...prev, start: parseDateFromInput(event.target.value) }))
              }
              className={DATE_INPUT}
            />
          </div>
          <div>
            <label htmlFor="rangeTo" className="mb-1 block text-xs text-slate-500">
              To
            </label>
            <input
              id="rangeTo"
              type="date"
              value={formatDateForInput(range.end)}
              onChange={(event) =>
                setRange((prev) => ({ ...prev, end: parseDateFromInput(event.target.value) }))
              }
              className={DATE_INPUT}
            />
          </div>

          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setRange({ start: preset.start, end: preset.end })}
              className={PRESET_BUTTON}
            >
              {preset.label}
            </button>
          ))}

          {hasActiveRange && (
            <button
              type="button"
              onClick={() => setRange({ start: null, end: null })}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors duration-150 hover:text-slate-800"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px rounded-t-xl border-b-2 px-4 py-2 text-sm font-medium transition-all duration-150 ease-out ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {activeRows.length} row{activeRows.length === 1 ? '' : 's'}
        {activeRows.length > PREVIEW_LIMIT ? ` — showing first ${PREVIEW_LIMIT}` : ''}
      </p>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-slate-400" />
        </div>
      ) : error ? (
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
                <tr key={index} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60">
                  {activeColumns.map((column) => {
                    const missing = isCellMissing(column, row[column])
                    return (
                      <td
                        key={column}
                        className={`px-3 py-2 whitespace-nowrap ${
                          missing ? 'bg-amber-100 font-medium text-amber-700' : 'text-slate-700'
                        }`}
                      >
                        {missing ? '⚠ missing' : String(row[column] ?? '')}
                      </td>
                    )
                  })}
                </tr>
              ))}

              {previewRows.length === 0 && (
                <tr>
                  <td colSpan={activeColumns.length} className="px-3 py-10 text-center text-slate-400">
                    No rows match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
