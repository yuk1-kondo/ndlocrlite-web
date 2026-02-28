interface FooterProps {
  lang: 'ja' | 'en'
  githubUrl?: string
}

export function Footer({ lang, githubUrl = 'https://github.com/yuk1-kondo/ndlocrlite-web' }: FooterProps) {
  return (
    <footer className="footer">
      <div className="footer-privacy">
        <span className="privacy-icon">🔒</span>
        {lang === 'ja' ? (
          <span>
            YK-OCRはWebブラウザで完結して動作します。選択した画像とOCR結果は外部に送信されません。
          </span>
        ) : (
          <span>
            YK-OCR runs entirely in your browser. Images and OCR results are never sent to any external server.
          </span>
        )}
      </div>
      <div className="footer-attribution">
        {lang === 'ja' ? (
          <span className="footer-attribution-text">
            OCRエンジンは国立国会図書館（NDL Lab）開発の{' '}
            <a href="https://github.com/ndl-lab/ndlocr-lite" target="_blank" rel="noopener noreferrer">
              NDLOCR-Lite
            </a>{' '}
            を使用しています。
          </span>
        ) : (
          <span className="footer-attribution-text">
            Powered by{' '}
            <a href="https://github.com/ndl-lab/ndlocr-lite" target="_blank" rel="noopener noreferrer">
              NDLOCR-Lite
            </a>{' '}
            (National Diet Library of Japan, NDL Lab).
          </span>
        )}
      </div>
      <div className="footer-meta">
        <span className="footer-author">
          {lang === 'ja' ? (
            <>
              by{' '}
              <a href="https://github.com/yuk1-kondo" target="_blank" rel="noopener noreferrer">
                yuk1-kondo
              </a>
            </>
          ) : (
            <>
              by{' '}
              <a href="https://github.com/yuk1-kondo" target="_blank" rel="noopener noreferrer">
                yuk1-kondo
              </a>
            </>
          )}
        </span>
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="footer-github"
        >
          GitHub ↗
        </a>
      </div>
    </footer>
  )
}
