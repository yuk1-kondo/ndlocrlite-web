/**
 * OCR Web Worker
 * バックグラウンドでOCR処理を実行
 * 参照実装: ndlkotenocr-worker/src/worker/ocr-worker.js
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
  private textRecognizer: TextRecognizer | null = null
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
        progress: 0.05,
        message: 'Initializing...',
      })

      const layoutModelData = await loadModel('layout', (progress) => {
        this.post({
          type: 'OCR_PROGRESS',
          stage: 'loading_layout_model',
          progress: 0.05 + progress * 0.4,
          message: `Loading layout model... ${Math.round(progress * 100)}%`,
        })
      })

      const recognitionModelData = await loadModel('recognition', (progress) => {
        this.post({
          type: 'OCR_PROGRESS',
          stage: 'loading_recognition_model',
          progress: 0.45 + progress * 0.4,
          message: `Loading recognition model... ${Math.round(progress * 100)}%`,
        })
      })

      this.layoutDetector = new LayoutDetector()
      await this.layoutDetector.initialize(layoutModelData)

      this.textRecognizer = new TextRecognizer()
      await this.textRecognizer.initialize(recognitionModelData)

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

      // Stage 2: 文字認識
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
        const result = await this.textRecognizer!.recognize(imageData, region)

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
