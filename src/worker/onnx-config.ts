/**
 * ONNX Runtime Web 設定
 * Web Worker内での統一設定
 */

import * as ort from 'onnxruntime-web'

function initializeONNX() {
  // WASMファイルをCDNから配信（安定性重視）
  ort.env.wasm.wasmPaths =
    'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/'

  // シングルスレッド・SIMD無効でより安定した動作を確保
  ort.env.wasm.numThreads = 1
  ort.env.wasm.simd = false
  ort.env.logLevel = 'warning'

  // Web Worker内ではプロキシワーカー不要
  ort.env.wasm.proxy = false
}

export async function createSession(
  modelData: ArrayBuffer,
  options: Partial<ort.InferenceSession.SessionOptions> = {}
): Promise<ort.InferenceSession> {
  const defaultOptions: ort.InferenceSession.SessionOptions = {
    executionProviders: ['cpu'],
    logSeverityLevel: 4,
    graphOptimizationLevel: 'basic',
    enableCpuMemArena: false,
    enableMemPattern: false,
    ...options,
  }

  try {
    const session = await ort.InferenceSession.create(modelData, defaultOptions)
    return session
  } catch (error) {
    console.error('Failed to create ONNX session:', error)
    throw error
  }
}

initializeONNX()

export { ort }
