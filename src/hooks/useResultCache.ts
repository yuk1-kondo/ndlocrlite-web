import { useState, useEffect, useCallback } from 'react'
import type { DBResultEntry } from '../types/db'
import { getAllResults, saveResult, clearResults } from '../utils/db'

export function useResultCache() {
  const [results, setResults] = useState<DBResultEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getAllResults()
      .then(setResults)
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  const save = useCallback(async (entry: DBResultEntry) => {
    await saveResult(entry)
    const updated = await getAllResults()
    setResults(updated)
  }, [])

  const clear = useCallback(async () => {
    await clearResults()
    setResults([])
  }, [])

  return { results, isLoading, saveResult: save, clearResults: clear }
}
