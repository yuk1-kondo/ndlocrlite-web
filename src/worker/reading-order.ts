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
  private columnDirection: ColumnDirection = 'right-to-left'

  /** width < height のブロックが半数以上なら縦書きと判定（参照実装 reorder.py:110 と等価） */
  private detectIsVertical(blocks: TextBlock[]): boolean {
    const verticalCount = blocks.filter(b => b.width < b.height).length
    return verticalCount * 2 >= blocks.length
  }

  /** 縦書き→幅の中央値×0.3、横書き→高さの中央値×0.3（参照実装 reorder.py:113-114 と等価） */
  private calcThreshold(blocks: TextBlock[], isVertical: boolean): number {
    const sizes = isVertical ? blocks.map(b => b.width) : blocks.map(b => b.height)
    const sorted = [...sizes].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return Math.max(median * 0.3, 1)
  }

  process(textBlocks: TextBlock[], options: ReadingOrderOptions = {}): TextBlock[] {
    if (!textBlocks || textBlocks.length === 0) return []

    const { minConfidence = 0.1 } = options

    const validBlocks = textBlocks.filter(
      (b) => b.confidence >= minConfidence && b.text && b.text.trim().length > 0
    )

    if (validBlocks.length === 0) return []

    // 方向の自動判定（options で明示された場合はそちらを優先）
    const isVertical = options.readingDirection
      ? options.readingDirection === 'vertical'
      : this.detectIsVertical(validBlocks)

    // スケール適応型の閾値（options で明示された場合はそちらを優先）
    const threshold = options.groupThreshold ?? this.calcThreshold(validBlocks, isVertical)

    // 横書き自動判定時は left-to-right をデフォルトに
    const colDir: ColumnDirection = options.columnDirection
      ?? (isVertical ? this.columnDirection : 'left-to-right')

    let ordered: TextBlock[]
    if (isVertical) {
      ordered = this.processVertical(validBlocks, colDir, threshold)
    } else {
      ordered = this.processHorizontal(validBlocks, colDir, threshold)
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
