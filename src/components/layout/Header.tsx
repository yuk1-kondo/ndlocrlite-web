import type { Language } from '../../i18n'

interface HeaderProps {
  lang: Language
  onToggleLanguage: () => void
  onOpenSettings: () => void
  onOpenHistory: () => void
  onLogoClick: () => void
  onStartOCR?: () => void
  canStartOCR?: boolean
}

export function Header({ lang, onToggleLanguage, onOpenSettings, onOpenHistory, onLogoClick, onStartOCR, canStartOCR }: HeaderProps) {
  return (
    <header className="header">
      <button className="header-title" onClick={onLogoClick}>
        <span className="header-logo-mark">YK</span>
        <h1>OCR</h1>
        <span className="header-divider" />
        <span className="header-subtitle">
          {lang === 'ja' ? 'ブラウザ完結・日本語OCR' : 'Japanese OCR in your browser'}
        </span>
      </button>
      <div className="header-actions">
        {canStartOCR && onStartOCR && (
          <button className="btn btn-primary btn-start-ocr" onClick={onStartOCR}>
            {lang === 'ja' ? '認識を開始' : 'Start Recognition'}
          </button>
        )}
        <button className="btn-icon" onClick={onOpenHistory} title={lang === 'ja' ? '処理履歴' : 'History'}>
          📋
        </button>
        <button className="btn-icon" onClick={onOpenSettings} title={lang === 'ja' ? '設定' : 'Settings'}>
          ⚙️
        </button>
        <button className="btn-lang" onClick={onToggleLanguage}>
          {lang === 'ja' ? 'English' : '日本語'}
        </button>
      </div>
    </header>
  )
}
