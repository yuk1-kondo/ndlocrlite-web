/**
 * OCR Web Worker
 * バックグラウンドでOCR処理を実行
 * 参照実装: ndlkotenocr-worker/src/worker/ocr-worker.js
 *
 * カスケード文字認識:
 *   charCountCategory=3 → recognizer30 (16×256, ≤30文字)
 *   charCountCategory=2 → recognizer50 (16×384, ≤50文字)
 *   それ以外            → recognizer100 (16×768, ≤100文字)
 */

import './onnx-config'
import { loadModel } from './model-loader'
import { LayoutDetector } from './layout-detector'
import { TextRecognizer } from './text-recognizer'
import { ReadingOrderProcessor } from './reading-order'
import type { TextBlock, TextRegion } from '../types/ocr'
import type { WorkerInMessage, WorkerOutMessage } from '../types/worker'

class OCRWorker {
  private layoutDetector: LayoutDetector | null = null
  private recognizer30: TextRecognizer | null = null  // ≤30文字 [1,3,16,256]
  private recognizer50: TextRecognizer | null = null  // ≤50文字 [1,3,16,384]
  private recognizer100: TextRecognizer | null = null // ≤100文字 [1,3,16,768]
  private readingOrderProcessor = new ReadingOrderProcessor()
  private isInitialized = false

  private post(message: WorkerOutMessage) {
    self.postMessage(message)
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.post({
        type: 'OCR_PROGRESS',
        stage: 'initializing',
        progress: 0.02,
        message: 'Initializing...',
      })

      // レイアウトモデル (38MB)
      const layoutModelData = await loadModel('layout', (progress) => {
        this.post({
          type: 'OCR_PROGRESS',
          stage: 'loading_layout_model',
          progress: 0.02 + progress * 0.23,
          message: `Loading layout model... ${Math.round(progress * 100)}%`,
        })
      })

      // 認識モデル30 (34MB)
      const rec30Data = await loadModel('recognition30', (progress) => {
        this.post({
          type: 'OCR_PROGRESS',
          stage: 'loading_recognition_model',
          progress: 0.25 + progress * 0.20,
          message: `Loading recognition model (30)... ${Math.round(progress * 100)}%`,
        })
      })

      // 認識モデル50 (35MB)
      const rec50Data = await loadModel('recognition50', (progress) => {
        this.post({
          type: 'OCR_PROGRESS',
          stage: 'loading_recognition_model',
          progress: 0.45 + progress * 0.20,
          message: `Loading recognition model (50)... ${Math.round(progress * 100)}%`,
        })
      })

      // 認識モデル100 (39MB)
      const rec100Data = await loadModel('recognition100', (progress) => {
        this.post({
          type: 'OCR_PROGRESS',
          stage: 'loading_recognition_model',
          progress: 0.65 + progress * 0.20,
          message: `Loading recognition model (100)... ${Math.round(progress * 100)}%`,
        })
      })

      this.layoutDetector = new LayoutDetector()
      await this.layoutDetector.initialize(layoutModelData)

      this.recognizer30 = new TextRecognizer([1, 3, 16, 256])
      await this.recognizer30.initialize(rec30Data)

      this.recognizer50 = new TextRecognizer([1, 3, 16, 384])
      await this.recognizer50.initialize(rec50Data)

      this.recognizer100 = new TextRecognizer([1, 3, 16, 768])
      await this.recognizer100.initialize(rec100Data)

      this.isInitialized = true

      this.post({
        type: 'OCR_PROGRESS',
        stage: 'initialized',
        progress: 1.0,
        message: 'Ready',
      })
    } catch (error) {
      this.post({
        type: 'OCR_ERROR',
        error: (error as Error).message,
        stage: 'initialization',
      })
      throw error
    }
  }

  /** charCountCategory に応じたモデルを選択 */
  private selectRecognizer(charCountCategory?: number): TextRecognizer {
    if (charCountCategory === 3) return this.recognizer30!
    if (charCountCategory === 2) return this.recognizer50!
    return this.recognizer100!
  }

  async processOCR(id: string, imageData: ImageData, startTime: number): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initialize()
      }

      // Stage 1: レイアウト検出
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'layout_detection',
        progress: 0.1,
        message: 'Detecting text regions...',
      })

      const textRegions: TextRegion[] = await this.layoutDetector!.detect(
        imageData,
        (progress) => {
          this.post({
            type: 'OCR_PROGRESS',
            id,
            stage: 'layout_detection',
            progress: 0.1 + progress * 0.3,
            message: `Detecting regions... ${Math.round(progress * 100)}%`,
          })
        }
      )

      // Stage 2: カスケード文字認識
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'text_recognition',
        progress: 0.4,
        message: `Recognizing text in ${textRegions.length} regions...`,
      })

      const recognitionResults: TextBlock[] = []
      for (let i = 0; i < textRegions.length; i++) {
        const region = textRegions[i]
        const recognizer = this.selectRecognizer(region.charCountCategory)
        const result = await recognizer.recognize(imageData, region)

        recognitionResults.push({
          ...region,
          text: result.text,
          readingOrder: i + 1,
        })

        this.post({
          type: 'OCR_PROGRESS',
          id,
          stage: 'text_recognition',
          progress: 0.4 + ((i + 1) / textRegions.length) * 0.4,
          message: `Recognized ${i + 1}/${textRegions.length} regions`,
        })
      }

      // Stage 3: 読み順処理
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'reading_order',
        progress: 0.8,
        message: 'Processing reading order...',
      })

      const orderedResults = this.readingOrderProcessor.process(recognitionResults)

      // Stage 4: 出力生成
      this.post({
        type: 'OCR_PROGRESS',
        id,
        stage: 'generating_output',
        progress: 0.9,
        message: 'Generating output...',
      })

      const txt = orderedResults
        .filter((b) => b.text)
        .map((b) => b.text)
        .join('\n')

      this.post({
        type: 'OCR_COMPLETE',
        id,
        textBlocks: orderedResults,
        txt,
        processingTime: Date.now() - startTime,
      })
    } catch (error) {
      this.post({
        type: 'OCR_ERROR',
        id,
        error: (error as Error).message,
      })
    }
  }
}

const ocrWorker = new OCRWorker()

self.onmessage = async (event: MessageEvent<WorkerInMessage>) => {
  const message = event.data

  switch (message.type) {
    case 'INITIALIZE':
      await ocrWorker.initialize()
      break

    case 'OCR_PROCESS':
      await ocrWorker.processOCR(message.id, message.imageData, message.startTime)
      break

    case 'TERMINATE':
      self.close()
      break
  }
}

self.onerror = (error) => {
  const message = typeof error === 'string' ? error : (error as ErrorEvent).message ?? 'Unknown error'
  self.postMessage({
    type: 'OCR_ERROR',
    error: message,
  } satisfies WorkerOutMessage)
}
