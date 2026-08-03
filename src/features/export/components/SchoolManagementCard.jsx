import { useEffect, useState } from 'react'
import DashboardTable from '../../../components/table/DashboardTable'
import Spinner from '../../../components/ui/Spinner'
import AlertPopup from '../../../components/ui/AlertPopup'
import { downloadSchoolListTemplate } from '../utils/schoolListExcel'
import { fetchSchoolsRequest, uploadSchoolListRequest } from '../../../api/schools.api'
import UploadSchoolListModal from './UploadSchoolListModal'
import UploadProgressModal from './UploadProgressModal'
import UploadSummaryModal from './UploadSummaryModal'

const COLUMNS = [
  { key: 'udise', label: 'UDISE', sortable: true },
  { key: 'schoolName', label: 'School Name', sortable: true },
  { key: 'district', label: 'District', sortable: true },
  { key: 'state', label: 'State' },
]

function DownloadIcon({ className = 'h-4 w-4' }) {
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

function UploadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 15V3m0 0l-4 4m4-4l4 4M5 21h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function SchoolManagementCard({ directoryVersion, onDirectoryChanged }) {
  const [backendSchools, setBackendSchools] = useState(null)
  const isBackendLoading = backendSchools === null

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadAttemptId, setUploadAttemptId] = useState(0)
  const [progressState, setProgressState] = useState(null)
  const [summaryData, setSummaryData] = useState(null)
  const [singlePopup, setSinglePopup] = useState(null)
  const [invalidFilePopup, setInvalidFilePopup] = useState(false)
  const [missingColumnsPopup, setMissingColumnsPopup] = useState(null)
  const [genericErrorPopup, setGenericErrorPopup] = useState(null)
  const [lastUploadedSignature, setLastUploadedSignature] = useState(null)

  const loadBackendSchools = async () => {
    try {
      const { data } = await fetchSchoolsRequest()
      setBackendSchools(data.data)
    } catch {
      setBackendSchools([])
    }
  }

  useEffect(() => {
    let isMounted = true
    fetchSchoolsRequest()
      .then(({ data }) => {
        if (isMounted) setBackendSchools(data.data)
      })
      .catch(() => {
        if (isMounted) setBackendSchools([])
      })
    return () => {
      isMounted = false
    }
  }, [directoryVersion])

  const directory = backendSchools ?? []

  const showSingleResultPopup = (result) => {
    if (result.status === 'registered') {
      setSinglePopup({ variant: 'success', title: 'School Registered Successfully', result })
    } else if (result.status === 'duplicate') {
      setSinglePopup({ variant: 'error', title: 'School Already Registered', result })
    } else {
      setSinglePopup({ variant: 'warning', title: 'Invalid Row', result })
    }
  }

  const handleConfirmUpload = async (file) => {
    setUploadAttemptId((id) => id + 1)
    setProgressState({ isComplete: false })

    try {
      const { data } = await uploadSchoolListRequest(file)
      const summary = data.data

      setLastUploadedSignature({ name: file.name, size: file.size, lastModified: file.lastModified })
      setProgressState({ isComplete: true })

      setTimeout(() => {
        setProgressState(null)
        setIsUploadModalOpen(false)
        if (summary.total === 1) {
          showSingleResultPopup(summary.results[0])
        } else {
          setSummaryData(summary)
        }
        loadBackendSchools()
        onDirectoryChanged?.()
      }, 600)
    } catch (error) {
      setProgressState(null)
      const missingColumns = error?.response?.data?.details?.missingColumns
      if (missingColumns?.length > 0) {
        setMissingColumnsPopup(missingColumns)
      } else {
        setGenericErrorPopup(
          error?.response?.data?.message || 'Something went wrong while uploading. Please try again.',
        )
      }
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">School Management</h2>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Upload a school list. Only UDISEs in this list can log in as teachers.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={downloadSchoolListTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700
              transition-all duration-200 ease-out hover:bg-slate-100"
          >
            <DownloadIcon />
            Download Template
          </button>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white
              transition-all duration-200 ease-out hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/20"
          >
            <UploadIcon />
            Upload School List
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Required Excel columns
        </p>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>
            <span className="font-semibold text-slate-800">UDISE</span> — 10-digit school code
            (used as username &amp; default password)
          </li>
          <li>
            <span className="font-semibold text-slate-800">School Name</span> — Full school name
          </li>
          <li>
            <span className="font-semibold text-slate-800">District</span> — District name
          </li>
          <li>
            <span className="font-semibold text-slate-800">State</span> — State name
          </li>
        </ul>
      </div>

      <div className="mt-6">
        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Current Schools ({directory.length}) — these UDISEs can log in as teachers
        </p>

        {isBackendLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-6 w-6 text-slate-400" />
          </div>
        ) : (
          <DashboardTable
            columns={COLUMNS}
            data={directory}
            searchKeys={['udise', 'schoolName', 'district']}
            searchPlaceholder="Search by UDISE, school or district..."
            emptyMessage="No schools uploaded yet."
          />
        )}
      </div>

      <UploadSchoolListModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onInvalidFile={() => setInvalidFilePopup(true)}
        onConfirmUpload={handleConfirmUpload}
        lastUploadedSignature={lastUploadedSignature}
      />

      <UploadProgressModal
        key={uploadAttemptId}
        isOpen={Boolean(progressState)}
        isComplete={Boolean(progressState?.isComplete)}
      />

      <UploadSummaryModal isOpen={Boolean(summaryData)} onClose={() => setSummaryData(null)} summary={summaryData} />

      <AlertPopup
        isOpen={invalidFilePopup}
        onClose={() => setInvalidFilePopup(false)}
        variant="error"
        title="Invalid File"
      >
        Only Excel (.xlsx) files are allowed.
      </AlertPopup>

      <AlertPopup
        isOpen={Boolean(missingColumnsPopup)}
        onClose={() => setMissingColumnsPopup(null)}
        variant="error"
        title="Missing Columns"
      >
        <ul className="space-y-1 font-medium text-slate-800">
          {(missingColumnsPopup || []).map((column) => (
            <li key={column}>{column}</li>
          ))}
        </ul>
        <p className="mt-3 text-slate-500">Please upload the correct template.</p>
      </AlertPopup>

      <AlertPopup
        isOpen={Boolean(genericErrorPopup)}
        onClose={() => setGenericErrorPopup(null)}
        variant="error"
        title="Upload Failed"
      >
        {genericErrorPopup}
      </AlertPopup>

      <AlertPopup
        isOpen={Boolean(singlePopup)}
        onClose={() => setSinglePopup(null)}
        variant={singlePopup?.variant}
        title={singlePopup?.title}
      >
        {singlePopup?.result && singlePopup.variant === 'success' && (
          <>
            <p>
              <span className="font-medium text-slate-800">School Name:</span>{' '}
              {singlePopup.result.schoolName}
            </p>
            <p className="mt-1">
              <span className="font-medium text-slate-800">UDISE:</span> {singlePopup.result.udise}
            </p>
            <p className="mt-3">The school has been added successfully.</p>
          </>
        )}
        {singlePopup?.result && singlePopup.variant === 'error' && (
          <>
            <p>This UDISE is already registered.</p>
            <p className="mt-3">Please delete the existing school first before uploading it again.</p>
          </>
        )}
        {singlePopup?.result && singlePopup.variant === 'warning' && <p>{singlePopup.result.message}</p>}
      </AlertPopup>
    </section>
  )
}
