import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncDataOptions {
  describeError: (error: unknown) => string
  onError?: (message: string) => void
}

export function useAsyncData<T>(load: () => Promise<T>, key: string, options: AsyncDataOptions) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)
  const latest = useRef({ load, options })

  useEffect(() => {
    latest.current = { load, options }
  })

  useEffect(() => {
    let cancelled = false
    const { load: currentLoad, options: currentOptions } = latest.current

    function handleSuccess(result: T) {
      if (cancelled) return
      setData(result)
      setError(null)
    }

    function handleFailure(requestError: unknown) {
      if (cancelled) return
      const message = currentOptions.describeError(requestError)
      setError(message)
      currentOptions.onError?.(message)
    }

    void currentLoad()
      .then(handleSuccess)
      .catch(handleFailure)
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [key, reloadKey])

  const refresh = useCallback(() => setReloadKey((current) => current + 1), [])
  const reload = useCallback(() => {
    setIsLoading(true)
    refresh()
  }, [refresh])

  return { data, error, isLoading, setData, refresh, reload }
}
