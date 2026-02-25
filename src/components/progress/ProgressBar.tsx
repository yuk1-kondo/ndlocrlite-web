import type { OCRJobState } from '../../types/ocr'

interface ProgressBarProps {
  jobState: OCRJobState
  lang: 'ja' | 'en'
}

export function ProgressBar({ jobState, lang }: ProgressBarProps) {
  const { status, currentFileIndex, totalFiles, stageProgress, message } = jobState

  if (status === 'idle') return null

  // 全体進捗: ファイル単位 + 現在ファイル内の進捗
  const overallProgress =
    totalFiles > 0
      ? ((currentFileIndex - 1 + stageProgress) / totalFiles) * 100
      : stageProgress * 100

  const isError = status === 'error'
  const isDone = status === 'done'

  return (
    <div className={`progress-container ${isError ? 'error' : ''}`}>
      {totalFiles > 1 && (
        <div className="progress-files">
          {lang === 'ja'
            ? `${currentFileIndex} / ${totalFiles} ファイル`
            : `${currentFileIndex} / ${totalFiles} files`}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className={`progress-bar-fill ${isDone ? 'done' : ''}`}
          style={{ width: `${Math.min(100, overallProgress)}%` }}
        />
      </div>
      <div className="progress-message">
        {isError ? jobState.errorMessage : message}
      </div>
    </div>
  )
}
