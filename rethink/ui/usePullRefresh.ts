import { useCallback, useState } from 'react'

/**
 * Spinner state for pull-to-refresh that is only true while the user's own pull runs.
 * Mounting a RefreshControl with refreshing=true (e.g. tied to a background load flag)
 * leaves the Android ScrollView offset by the spinner, hiding the top of the screen.
 */
export function usePullRefresh(refresh: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refresh()
    } finally {
      setRefreshing(false)
    }
  }, [refresh])
  return { refreshing, onRefresh }
}
