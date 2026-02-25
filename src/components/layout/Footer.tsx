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
          ? 'このシステムはONNX Web Runtime技術を使用しており、Webブラウザで完結して動作します。選択した画像とOCR結果は外部に送信されません。'
          : 'This system uses ONNX Web Runtime technology and runs entirely in your browser. Selected images and OCR results are never sent to any external server.'}
      </div>
      <div className="footer-attribution">
        {lang === 'ja' ? (
          <span className="footer-attribution-text">
            本ツールは国立国会図書館（NDL Lab）が開発した{' '}
            <a href="https://github.com/ndl-lab/ndlocr-lite" target="_blank" rel="noopener noreferrer">
              NDLOCR-Lite
            </a>{' '}
            のWebブラウザ版です。OCRモデルはNDLOCR-Liteのものを使用しています。
          </span>
        ) : (
          <span className="footer-attribution-text">
            This tool is a web browser port of{' '}
            <a href="https://github.com/ndl-lab/ndlocr-lite" target="_blank" rel="noopener noreferrer">
              NDLOCR-Lite
            </a>{' '}
            developed by the National Diet Library of Japan (NDL Lab). OCR models are from NDLOCR-Lite.
          </span>
        )}
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
