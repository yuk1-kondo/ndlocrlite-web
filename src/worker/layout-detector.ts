/**
 * レイアウト検出モジュール
 * RTMDet-sモデルを使用してテキスト領域を検出
 * 参照実装: ndlkotenocr-worker/src/worker/layout-detector.js
 */

import type * as OrtType from 'onnxruntime-web'
import { ort, createSession } from './onnx-config'
import type { TextRegion } from '../types/ocr'

interface PreprocessResult {
  tensor: OrtType.Tensor
  metadata: {
    originalWidth: number
    originalHeight: number
    maxWH: number
    inputWidth: number
    inputHeight: number
  }
}

export class LayoutDetector {
  private session: OrtType.InferenceSession | null = null
  private inputSize = { width: 1024, height: 1024 }
  private initialized = false

  async initialize(modelData: ArrayBuffer): Promise<void> {
    if (this.initialized) return

    try {
      this.session = await createSession(modelData)
      this.initialized = true
      console.log('Layout detector initialized successfully')
    } catch (error) {
      console.error('Failed to initialize layout detector:', error)
      throw error
    }
  }

  async detect(
    imageData: ImageData,
    onProgress?: (progress: number) => void
  ): Promise<TextRegion[]> {
    if (!this.initialized || !this.session) {
      throw new Error('Layout detector not initialized')
    }

    if (onProgress) onProgress(0.1)
    const { tensor, metadata } = await this.preprocessImage(imageData)

    if (onProgress) onProgress(0.5)
    const output = await this.session.run({ input: tensor })

    if (onProgress) onProgress(0.8)
    const detections = this.postprocessOutput(output, metadata)

    if (onProgress) onProgress(1.0)
    console.log(`[LayoutDetector] ${detections.length} regions detected`)
    return detections
  }

  private async preprocessImage(imageData: ImageData): Promise<PreprocessResult> {
    return new Promise((resolve, reject) => {
      try {
        const originalSize = { width: imageData.width, height: imageData.height }
        const maxWH = Math.max(originalSize.width, originalSize.height)

        // 元画像をOffscreenCanvasに描画
        const imageCanvas = new OffscreenCanvas(imageData.width, imageData.height)
        const imageCtx = imageCanvas.getContext('2d')!
        imageCtx.putImageData(imageData, 0, 0)

        // 正方形パディング（左上に配置、黒背景）
        const paddingCanvas = new OffscreenCanvas(maxWH, maxWH)
        const paddingCtx = paddingCanvas.getContext('2d')!
        paddingCtx.fillStyle = 'rgb(0, 0, 0)'
        paddingCtx.fillRect(0, 0, maxWH, maxWH)
        paddingCtx.drawImage(imageCanvas, 0, 0)

        // モデル入力サイズにリサイズ
        const canvas = new OffscreenCanvas(this.inputSize.width, this.inputSize.height)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(paddingCanvas, 0, 0, maxWH, maxWH, 0, 0, this.inputSize.width, this.inputSize.height)

        const resizedImageData = ctx.getImageData(0, 0, this.inputSize.width, this.inputSize.height)
        const { data } = resizedImageData

        // NCHW形式 + ImageNet正規化
        const tensorData = new Float32Array(1 * 3 * this.inputSize.height * this.inputSize.width)
        const mean = [123.675, 116.28, 103.53]
        const std = [58.395, 57.12, 57.375]

        for (let h = 0; h < this.inputSize.height; h++) {
          for (let w = 0; w < this.inputSize.width; w++) {
            const pixelOffset = (h * this.inputSize.width + w) * 4
            for (let c = 0; c < 3; c++) {
              const tensorIdx =
                c * this.inputSize.height * this.inputSize.width +
                h * this.inputSize.width +
                w
              tensorData[tensorIdx] = (data[pixelOffset + c] - mean[c]) / std[c]
            }
          }
        }

        const inputTensor = new ort.Tensor('float32', tensorData, [
          1,
          3,
          this.inputSize.height,
          this.inputSize.width,
        ])

        resolve({
          tensor: inputTensor,
          metadata: {
            originalWidth: originalSize.width,
            originalHeight: originalSize.height,
            maxWH,
            inputWidth: this.inputSize.width,
            inputHeight: this.inputSize.height,
          },
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  private postprocessOutput(
    output: Record<string, OrtType.Tensor>,
    metadata: PreprocessResult['metadata']
  ): TextRegion[] {
    const detections: TextRegion[] = []

    try {
      const outputKeys = Object.keys(output)

      let detsData: number[]
      let labelsData: number[]

      if (output['dets'] && output['labels']) {
        detsData = Array.from(output['dets'].data as Float32Array)
        const rawLabels = output['labels'].data as Float32Array | BigInt64Array
        labelsData = Array.from({ length: rawLabels.length }, (_, i) => Number(rawLabels[i]))
      } else {
        const outputTensor = output[outputKeys[0]]
        const outputData = outputTensor.data as Float32Array
        const numDetections = outputTensor.dims[1]
        detsData = []
        labelsData = []
        for (let i = 0; i < numDetections; i++) {
          const offset = i * 6
          for (let j = 0; j < 5; j++) {
            detsData.push(outputData[offset + j])
          }
          labelsData.push(outputData[offset + 5] || 0)
        }
      }

      const numDetections = detsData.length / 5

      for (let i = 0; i < numDetections; i++) {
        const x1 = detsData[i * 5 + 0]
        const y1 = detsData[i * 5 + 1]
        const x2 = detsData[i * 5 + 2]
        const y2 = detsData[i * 5 + 3]
        const score = detsData[i * 5 + 4]
        const classId = Number(labelsData[i])

        if (score < 0.3) continue

        // 入力サイズ → 元画像サイズに座標変換
        const normX1 = x1 / this.inputSize.width
        const normY1 = y1 / this.inputSize.height
        const normX2 = x2 / this.inputSize.width
        const normY2 = y2 / this.inputSize.height

        const squareSize = metadata.maxWH
        const origX1 = normX1 * squareSize
        const origY1 = normY1 * squareSize
        const origX2 = normX2 * squareSize
        const origY2 = normY2 * squareSize

        // バウンディングボックスを上下2%拡張
        const boxHeight = origY2 - origY1
        const deltaH = boxHeight * 0.02

        const finalX1 = Math.max(0, Math.round(origX1))
        const finalY1 = Math.max(0, Math.round(origY1 - deltaH))
        const finalX2 = Math.min(metadata.originalWidth, Math.round(origX2))
        const finalY2 = Math.min(metadata.originalHeight, Math.round(origY2 + deltaH))

        const width = finalX2 - finalX1
        const height = finalY2 - finalY1

        if (width < 10 || height < 10) continue

        detections.push({
          x: finalX1,
          y: finalY1,
          width,
          height,
          confidence: score,
          classId,
        })
      }

      return this.applyNMS(detections, 0.5)
    } catch (error) {
      console.error('Error in postprocessing:', error)
      return []
    }
  }

  private applyNMS(detections: TextRegion[], iouThreshold: number): TextRegion[] {
    if (detections.length === 0) return []

    detections.sort((a, b) => b.confidence - a.confidence)

    const keep: TextRegion[] = []
    const suppressed = new Set<number>()

    for (let i = 0; i < detections.length; i++) {
      if (suppressed.has(i)) continue
      keep.push(detections[i])

      for (let j = i + 1; j < detections.length; j++) {
        if (suppressed.has(j)) continue
        if (this.calculateIoU(detections[i], detections[j]) > iouThreshold) {
          suppressed.add(j)
        }
      }
    }

    return keep
  }

  private calculateIoU(a: TextRegion, b: TextRegion): number {
    const xA = Math.max(a.x, b.x)
    const yA = Math.max(a.y, b.y)
    const xB = Math.min(a.x + a.width, b.x + b.width)
    const yB = Math.min(a.y + a.height, b.y + b.height)

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA)
    const aArea = a.width * a.height
    const bArea = b.width * b.height

    return interArea / (aArea + bArea - interArea)
  }

  dispose(): void {
    if (this.session) {
      this.session.release()
      this.session = null
    }
    this.initialized = false
  }
}
