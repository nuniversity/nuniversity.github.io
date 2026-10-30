'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, FileJson, FileSpreadsheet, Upload, X } from 'lucide-react'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  /**
   * Handles the file contents. Return an error message to keep the dialog
   * open, or `null` when the import succeeded.
   */
  onImport: (content: string, filename: string) => string | null
  title: string
  description: string
  cancelLabel: string
  selectLabel: string
  dragDropLabel: string
  supportedLabel: string
  successLabel?: string
}

/**
 * Accessible import dialog shared by the SWOT and Eisenhower tools.
 *
 * Adds what both copies previously lacked: real dialog semantics, Escape and
 * backdrop close, focus restoration, a working drag-and-drop zone, and a file
 * input reset so re-selecting the same file fires `change` again.
 */
export function ImportDialog({
  open,
  onClose,
  onImport,
  title,
  description,
  cancelLabel,
  selectLabel,
  dragDropLabel,
  supportedLabel,
  successLabel,
}: ImportDialogProps) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    setError('')
    setSuccess(false)
    const previous = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return
    setError('')
    try {
      const content = await file.text()
      const message = onImport(content, file.name)
      if (message) setError(message)
      else if (successLabel) setSuccess(true)
      else onClose()
    } catch {
      setError('Could not read this file.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 outline-none"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={titleId} className="text-xl font-bold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label={cancelLabel}
            className="p-1 rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <input
          ref={inputRef}
          type="file"
          accept=".json,.csv,application/json,text/csv"
          onChange={(event) => void handleFile(event.target.files?.[0])}
          className="sr-only"
        />

        <div
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            void handleFile(event.dataTransfer.files?.[0])
          }}
          role="button"
          tabIndex={0}
          aria-label={selectLabel}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-2" aria-hidden="true">
              <FileJson className="w-8 h-8 text-primary" />
              <FileSpreadsheet className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="font-medium mb-1">{dragDropLabel}</p>
              <p className="text-xs text-muted-foreground">{supportedLabel}</p>
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && successLabel && (
          <div
            role="status"
            className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300"
          >
            {successLabel}
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-muted hover:opacity-80 transition-opacity"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            {selectLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
