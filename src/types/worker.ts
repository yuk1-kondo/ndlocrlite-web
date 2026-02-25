import type { TextBlock } from './ocr'

// Workerへ送信するメッセージ
export type WorkerInMessage =
  | { type: 'INITIALIZE' }
  | {
      type: 'OCR_PROCESS'
      id: string
      imageData: ImageData
      startTime: number
    }
  | { type: 'TERMINATE' }

// Workerから受信するメッセージ
export type WorkerOutMessage =
  | {
      type: 'OCR_PROGRESS'
      id?: string
      stage: string
      progress: number
      message: string
    }
  | {
      type: 'OCR_COMPLETE'
      id: string
      textBlocks: TextBlock[]
      txt: string
      processingTime: number
    }
  | {
      type: 'OCR_ERROR'
      id?: string
      error: string
      stage?: string
    }
