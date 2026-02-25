import type { TextBlock } from './ocr'

export interface DBModelEntry {
  name: string // 'layout' | 'recognition'
  data: ArrayBuffer
  cachedAt: number // Unix timestamp (ms)
  version: string // モデルのバージョン管理用
}

export interface DBResultEntry {
  id: string
  fileName: string
  imageDataUrl: string // 縮小サムネイル (base64)
  textBlocks: TextBlock[]
  fullText: string
  processingTimeMs: number
  createdAt: number // Unix timestamp (ms)
}
