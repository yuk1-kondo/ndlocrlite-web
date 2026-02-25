import { useState, useCallback } from 'react'
import type { ProcessedImage } from '../types/ocr'
import { fileToProcessedImage } from '../utils/imageLoader'
import { pdfToProcessedImages } from '../utils/pdfLoader'

export function useFileProcessor() {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processFiles = useCallback(async (files: File[]) => {
    setIsLoading(true)
    setError(null)

    const images: ProcessedImage[] = []

    try {
      for (const file of files) {
        if (file.type === 'application/pdf') {
          const pages = await pdfToProcessedImages(file)
          images.push(...pages)
        } else if (file.type.startsWith('image/')) {
          const img = await fileToProcessedImage(file)
          images.push(img)
        }
      }
      setProcessedImages(images)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearImages = useCallback(() => {
    setProcessedImages([])
    setError(null)
  }, [])

  return { processedImages, isLoading, error, processFiles, clearImages }
}
