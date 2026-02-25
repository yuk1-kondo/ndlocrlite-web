interface FooterProps {
  lang: 'ja' | 'en'
  githubUrl?: string
}

export function Footer({ lang, githubUrl = 'https://github.com/yuta1984/ndlocrlite-web' }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-privacy">
        <span className="privacy-icon">🔒</span>
        {lang === 'ja'
          ? 'このアプリはWebブラウザで完結して動作します。選択した画像とOCR結果は外部に送信されません。'
          : 'This app runs entirely in your browser. Selected images and OCR results are never sent to any external server.'}
      </div>
      <div className="footer-meta">
        <span className="footer-author">
          {lang === 'ja'
            ? '作成者: 橋本雄太（国立歴史民俗博物館、国立国会図書館 非常勤調査員）'
            : 'Created by Yuta Hashimoto (National Museum of Japanese History / NDL)'}
        </span>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-github"
        >
          {lang === 'ja' ? 'GitHubリポジトリ' : 'GitHub Repository'} ↗
        </a>
      </div>
    </footer>
  )
}
