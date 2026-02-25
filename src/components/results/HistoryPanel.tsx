import { useState } from 'react'
import type { DBResultEntry } from '../../types/db'

interface HistoryPanelProps {
  results: DBResultEntry[]
  onSelect: (entry: DBResultEntry) => void
  onClear: () => void
  onClose: () => void
  lang: 'ja' | 'en'
}

export function HistoryPanel({ results, onSelect, onClear, onClose, lang }: HistoryPanelProps) {
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = () => {
    if (confirmClear) {
      onClear()
      setConfirmClear(false)
    } else {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
    }
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>{lang === 'ja' ? '処理履歴' : 'History'}</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="panel-body">
          {results.length === 0 ? (
            <p className="empty-message">
              {lang === 'ja' ? '処理履歴がありません' : 'No history yet'}
            </p>
          ) : (
            <ul className="history-list">
              {results.map((entry) => (
                <li key={entry.id} className="history-item" onClick={() => onSelect(entry)}>
                  <img
                    src={entry.imageDataUrl}
                    alt={entry.fileName}
                    className="history-thumb"
                  />
                  <div className="history-info">
                    <span className="history-filename">{entry.fileName}</span>
                    <span className="history-date">{formatDate(entry.createdAt)}</span>
                    <span className="history-preview">
                      {entry.fullText
                        ? entry.fullText.slice(0, 60) + '...'
                        : (lang === 'ja' ? 'テキストなし' : 'No text')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-footer">
          <button
            className={`btn ${confirmClear ? 'btn-danger' : 'btn-secondary'}`}
            onClick={handleClear}
            disabled={results.length === 0}
          >
            {confirmClear
              ? (lang === 'ja' ? '本当に削除しますか？' : 'Confirm delete?')
              : (lang === 'ja' ? 'キャッシュをクリア' : 'Clear Cache')}
          </button>
        </div>
      </div>
    </div>
  )
}
