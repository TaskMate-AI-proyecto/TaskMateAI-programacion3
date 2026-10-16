import { getApiErrorMessage } from '../api/errors'
import { useToast } from './useToast'

type ActionResult<T> = { ok: true; value: T } | { ok: false }

export function useSafeAction() {
  const { notify } = useToast()

  return async function runSafely<T>(action: () => Promise<T>, describeError: (error: unknown) => string = getApiErrorMessage): Promise<ActionResult<T>> {
    try {
      return { ok: true, value: await action() }
    } catch (error) {
      notify(describeError(error), 'error')
      return { ok: false }
    }
  }
}
