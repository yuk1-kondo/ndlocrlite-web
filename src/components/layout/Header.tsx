import type { Language } from '../../i18n'

interface HeaderProps {
  lang: Language
  onToggleLanguage: () => void
  onOpenSettings: () => void
  onOpenHistory: () => void
}

export function Header({ lang, onToggleLanguage, onOpenSettings, onOpenHistory }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-title">
        <h1>NDLOCR-Lite Web</h1>
        <span className="header-subtitle">
          {lang === 'ja' ? 'ブラウザで動く日本語OCR' : 'Japanese OCR in the Browser'}
        </span>
      </div>
      <div className="header-actions">
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
