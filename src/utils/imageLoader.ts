/**
 * 画像ファイル → ImageData + サムネイルDataUrl 変換
 */

import type { ProcessedImage } from '../types/ocr'

const THUMBNAIL_MAX_WIDTH = 200

export async function fileToProcessedImage(file: File): Promise<ProcessedImage> {
  const imageData = await fileToImageData(file)
  const thumbnailDataUrl = makeThumbnailDataUrl(imageData)

  return {
    fileName: file.name,
    imageData,
    thumbnailDataUrl,
  }
}

async function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

export function makeThumbnailDataUrl(imageData: ImageData): string {
  const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / imageData.width)
  const w = Math.round(imageData.width * scale)
  const h = Math.round(imageData.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // ImageData → 元サイズキャンバス → 縮小キャンバス
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = imageData.width
  srcCanvas.height = imageData.height
  srcCanvas.getContext('2d')!.putImageData(imageData, 0, 0)
  ctx.drawImage(srcCanvas, 0, 0, w, h)

  return canvas.toDataURL('image/jpeg', 0.7)
}

export function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  canvas.getContext('2d')!.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.85)
}
