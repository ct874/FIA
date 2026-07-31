import { useMemo, useRef, useState } from 'react'
import Modal from '../../../components/ui/Modal'

const ACCEPTED_EXTENSION = '.xlsx'
const ACCEPTED_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function UploadCloudIcon({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 18a4.5 4.5 0 01-.5-8.98 5.5 5.5 0 0110.9-1.02A4.5 4.5 0 0117 18H7z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 12v6m0-6l-2.5 2.5M12 12l2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FileIcon({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isValidExcelFile(file) {
  const nameIsXlsx = file.name.toLowerCase().endsWith(ACCEPTED_EXTENSION)
  const mimeIsXlsx = !file.type || file.type === ACCEPTED_MIME
  return nameIsXlsx && mimeIsXlsx
}

export default function UploadSchoolListModal({
  isOpen,
  onClose,
  onInvalidFile,
  onConfirmUpload,
  lastUploadedSignature,
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const isRepeatFile = useMemo(() => {
    if (!selectedFile || !lastUploadedSignature) return false
    return (
      selectedFile.name === lastUploadedSignature.name &&
      selectedFile.size === lastUploadedSignature.size &&
      selectedFile.lastModified === lastUploadedSignature.lastModified
    )
  }, [selectedFile, lastUploadedSignature])

  const handleFiles = (fileList) => {
    const file = fileList?.[0]
    if (!file) return

    if (!isValidExcelFile(file)) {
      onInvalidFile()
      return
    }
    setSelectedFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragActive(false)
    handleFiles(event.dataTransfer.files)
  }

  const handleClose = () => {
    setSelectedFile(null)
    setIsDragActive(false)
    onClose()
  }

  const handleUploadClick = () => {
    if (!selectedFile) return
    const file = selectedFile
    setSelectedFile(null)
    onConfirmUpload(file)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6 sm:p-8">
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">Upload School List</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Upload an Excel (.xlsx) file containing the school information.
        </p>

        <div
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragActive(true)
          }}
          onDragLeave={() => setIsDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`mt-6 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 ease-out
            ${selectedFile ? 'cursor-default border-slate-200 bg-slate-50/60' : 'cursor-pointer border-slate-300 hover:border-blue-400 hover:bg-blue-50/40'}
            ${isDragActive ? 'border-blue-500 bg-blue-50/60' : ''}`}
        >
          {!selectedFile ? (
            <>
              <UploadCloudIcon className="h-10 w-10 text-slate-400" />
              <p className="text-sm font-medium text-slate-700">
                Drag &amp; drop your .xlsx file here, or <span className="text-blue-600 underline">browse</span>
              </p>
              <p className="text-xs text-slate-400">Only .xlsx files are accepted</p>
            </>
          ) : (
            <div className="flex w-full items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm shadow-slate-900/5">
              <div className="flex items-center gap-3 text-left">
                <FileIcon className="h-8 w-8 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  setSelectedFile(null)
                }}
                className="shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-100"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        {isRepeatFile && (
          <p className="mt-3 text-xs font-medium text-amber-600">
            You already uploaded a file with this exact name and size. Uploading again is safe —
            already-registered schools are simply skipped.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={!selectedFile}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white
              transition-all duration-200 ease-out hover:bg-slate-800 hover:shadow-md hover:shadow-slate-900/20
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upload
          </button>
        </div>
      </div>
    </Modal>
  )
}
