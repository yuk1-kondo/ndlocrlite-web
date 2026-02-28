import { useRef, useState } from 'react'

interface FileDropZoneProps {
  onFilesSelected: (files: File[]) => void
  lang: 'ja' | 'en'
  disabled?: boolean
}

export function FileDropZone({ onFilesSelected, lang, disabled = false }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return
    const accepted = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.type.startsWith('image/')
    )
    if (accepted.length > 0) onFilesSelected(accepted)
  }

  return (
    <div
      className={`dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files) }}
    >
      <div className="dropzone-icon">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
          <path d="M12 12v9"/>
          <path d="m8 17 4-5 4 5"/>
        </svg>
      </div>
      <p className="dropzone-title">
        {lang === 'ja' ? 'ファイルをドロップ' : 'Drop files here'}
      </p>
      <p className="dropzone-text">
        {lang === 'ja' ? 'またはクリックして選択' : 'or click to browse'}
      </p>
      <p className="dropzone-formats">JPG &nbsp;·&nbsp; PNG &nbsp;·&nbsp; PDF</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,application/pdf"
        onChange={(e) => handleFiles(e.target.files)}
        style={{ display: 'none' }}
      />
    </div>
  )
}
