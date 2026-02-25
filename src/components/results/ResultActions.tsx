import { useState } from 'react'
import type { OCRResult } from '../../types/ocr'
import { downloadText, copyToClipboard } from '../../utils/textExport'

interface ResultActionsProps {
  results: OCRResult[]
  currentResult: OCRResult | null
  lang: 'ja' | 'en'
}

export function ResultActions({ results, currentResult, lang }: ResultActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = currentResult?.fullText ?? ''
    try {
      await copyToClipboard(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(lang === 'ja' ? 'コピーに失敗しました' : 'Failed to copy')
    }
  }

  const handleDownload = () => {
    if (!currentResult) return
    downloadText(currentResult.fullText, currentResult.fileName)
  }

  const handleDownloadAll = () => {
    if (results.length === 0) return
    const allText = results.map((r) => `=== ${r.fileName} ===\n${r.fullText}`).join('\n\n')
    downloadText(allText, 'ocr_results')
  }

  const disabled = !currentResult

  return (
    <div className="result-actions">
      <button className="btn btn-primary" onClick={handleCopy} disabled={disabled}>
        {copied ? (lang === 'ja' ? 'コピーしました！' : 'Copied!') : (lang === 'ja' ? 'コピー' : 'Copy')}
      </button>
      <button className="btn btn-secondary" onClick={handleDownload} disabled={disabled}>
        {lang === 'ja' ? 'ダウンロード' : 'Download'}
      </button>
      {results.length > 1 && (
        <button className="btn btn-secondary" onClick={handleDownloadAll}>
          {lang === 'ja' ? '全てダウンロード' : 'Download All'}
        </button>
      )}
    </div>
  )
}
