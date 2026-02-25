/**
 * 読み順処理モジュール
 * 参照実装: ndlkotenocr-worker/src/worker/reading-order.js
 */

import type { TextBlock } from '../types/ocr'

type ReadingDirection = 'vertical' | 'horizontal'
type ColumnDirection = 'right-to-left' | 'left-to-right'

interface ReadingOrderOptions {
  readingDirection?: ReadingDirection
  columnDirection?: ColumnDirection
  groupThreshold?: number
  minConfidence?: number
}

export class ReadingOrderProcessor {
  private readingDirection: ReadingDirection = 'vertical'
  private columnDirection: ColumnDirection = 'right-to-left'

  process(textBlocks: TextBlock[], options: ReadingOrderOptions = {}): TextBlock[] {
    if (!textBlocks || textBlocks.length === 0) return []

    const {
      readingDirection = this.readingDirection,
      columnDirection = this.columnDirection,
      groupThreshold = 20,
      minConfidence = 0.1,
    } = options

    const validBlocks = textBlocks.filter(
      (b) => b.confidence >= minConfidence && b.text && b.text.trim().length > 0
    )

    if (validBlocks.length === 0) return []

    let ordered: TextBlock[]
    if (readingDirection === 'vertical') {
      ordered = this.processVertical(validBlocks, columnDirection, groupThreshold)
    } else {
      ordered = this.processHorizontal(validBlocks, columnDirection, groupThreshold)
    }

    return ordered.map((block, index) => ({ ...block, readingOrder: index + 1 }))
  }

  private processVertical(
    blocks: TextBlock[],
    columnDirection: ColumnDirection,
    threshold: number
  ): TextBlock[] {
    const columns = this.groupIntoColumns(blocks, threshold)
    const sorted = this.sortColumns(columns, columnDirection)
    return sorted.flatMap((col) => col.sort((a, b) => a.y - b.y))
  }

  private processHorizontal(
    blocks: TextBlock[],
    columnDirection: ColumnDirection,
    threshold: number
  ): TextBlock[] {
    const lines = this.groupIntoLines(blocks, threshold)
    const sortedLines = lines.sort((a, b) => {
      const avgYA = a.reduce((s, b) => s + b.y, 0) / a.length
      const avgYB = b.reduce((s, b) => s + b.y, 0) / b.length
      return avgYA - avgYB
    })
    return sortedLines.flatMap((line) =>
      columnDirection === 'left-to-right'
        ? line.sort((a, b) => a.x - b.x)
        : line.sort((a, b) => b.x - a.x)
    )
  }

  private groupIntoColumns(blocks: TextBlock[], threshold: number): TextBlock[][] {
    const columns: TextBlock[][] = []
    for (const block of blocks) {
      const cx = block.x + block.width / 2
      const col = columns.find((c) => {
        const avgX = c.reduce((s, b) => s + b.x + b.width / 2, 0) / c.length
        return Math.abs(cx - avgX) <= threshold
      })
      if (col) col.push(block)
      else columns.push([block])
    }
    return columns
  }

  private groupIntoLines(blocks: TextBlock[], threshold: number): TextBlock[][] {
    const lines: TextBlock[][] = []
    for (const block of blocks) {
      const cy = block.y + block.height / 2
      const line = lines.find((l) => {
        const avgY = l.reduce((s, b) => s + b.y + b.height / 2, 0) / l.length
        return Math.abs(cy - avgY) <= threshold
      })
      if (line) line.push(block)
      else lines.push([block])
    }
    return lines
  }

  private sortColumns(columns: TextBlock[][], direction: ColumnDirection): TextBlock[][] {
    return columns.sort((a, b) => {
      const avgXA = a.reduce((s, b) => s + b.x + b.width / 2, 0) / a.length
      const avgXB = b.reduce((s, b) => s + b.x + b.width / 2, 0) / b.length
      return direction === 'right-to-left' ? avgXB - avgXA : avgXA - avgXB
    })
  }
}
