import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  AppState,
  FlatList,
  SafeAreaView,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import {
  EventFrequency,
  checkForPermission,
  queryAndAggregateUsageStats,
  showUsageAccessSettings,
} from '@brighthustle/react-native-usage-stats-manager'
import { color } from '../../constant/color'
import FilterTabs, { FilterRange } from './components/FilterTabs'
import UsageOverview from './components/UsageOverview'
import UsageGraph from './components/UsageGraph'

interface AppUsageStats {
  packageName: string
  totalTimeInForeground: number
  lastTimeUsed: number
  appLaunchCount: number
  isSystem: boolean
  appName?: string
}

export default function Home() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [usageData, setUsageData] = useState<AppUsageStats[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeRange, setActiveRange] = useState<FilterRange>('DAILY')

  useEffect(() => {
    console.log('[Home] mounted')
    console.log('[Platform]', Platform.OS)

    if (Platform.OS !== 'android') {
      console.log('[Error] Not Android')
      setError('Usage stats are only available on Android')
      return
    }

    console.log('[Calling] checkPermission()')
    checkPermission()

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      console.log('[Home] unmounted')
      subscription.remove()
    }
  }, [])

  const handleAppStateChange = async (state: string) => {
    console.log('[AppState]', state)
    if (state === 'active') {
      console.log('[AppState] app active → checking permission')
      checkPermission()
    }
  }

  useEffect(() => {
    if (hasPermission) {
      fetchUsageStats()
    }
  }, [activeRange, hasPermission])

  const checkPermission = async () => {
    console.log('[checkPermission] started')
    try {
      const granted = await checkForPermission()
      console.log('[checkPermission] result:', granted)

      setHasPermission(granted)

      if (granted) {
        console.log('[Permission] granted → fetching usage stats')
        fetchUsageStats()
      } else {
        console.log('[Permission] NOT granted')
      }
    } catch (e) {
      console.log('[checkPermission] error:', e)
      setError('Permission check failed')
    }
  }

  const openPermissionSettings = () => {
    console.log('[Action] openUsageAccessSettings')
    showUsageAccessSettings('')
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor(ms / (1000 * 60 * 60))

    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (parts.length === 0) return `${seconds}s`
    return parts.join(' ')
  }

  const fetchUsageStats = async () => {
    setRefreshing(true)

    try {
      const endMilliseconds = Date.now()
      let startMilliseconds = endMilliseconds - 24 * 60 * 60 * 1000

      if (activeRange === 'WEEKLY') {
        startMilliseconds = endMilliseconds - 7 * 24 * 60 * 60 * 1000
      } else if (activeRange === 'MONTHLY') {
        startMilliseconds = endMilliseconds - 30 * 24 * 60 * 60 * 1000
      }

      const rawResult = await queryAndAggregateUsageStats(
        startMilliseconds,
        endMilliseconds
      )

      console.log('[fetchUsageStats] raw result:', rawResult)

      // 🔥 CONVERT OBJECT → ARRAY
      const usageArray: AppUsageStats[] = Object.values(rawResult as any)

      console.log('[fetchUsageStats] array:', usageArray)

      const filteredResult = usageArray
        .filter(app => app.totalTimeInForeground > 0 && !app.isSystem)
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)

      console.log('[fetchUsageStats] filtered:', filteredResult)

      setUsageData(filteredResult)
    } catch (e) {
      console.error('[fetchUsageStats] error:', e)
      setError('Failed to fetch usage stats')
    } finally {
      setRefreshing(false)
    }
  }


  const renderItem = ({ item }: { item: AppUsageStats }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemIconContainer}>
          <Text style={styles.itemIconText}>
            {(item.appName || item.packageName.split('.').pop())?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.packageName} numberOfLines={1}>
            {item.appName || item.packageName.split('.').pop()}
          </Text>
          <View style={styles.itemSubInfo}>
            <Ionicons name="repeat-outline" size={12} color={color.secondary} />
            <Text style={styles.launchText}>{item.appLaunchCount || 0} launches</Text>
          </View>
        </View>
        <View style={styles.itemStats}>
          <Text style={styles.usageTime}>
            {formatTime(item.totalTimeInForeground)}
          </Text>
        </View>
      </View>
    )
  }

  const renderHeader = () => {
    const totalMs = usageData.reduce((acc, curr) => acc + curr.totalTimeInForeground, 0);
    const totalLaunches = usageData.reduce((acc, curr) => acc + (curr.appLaunchCount || 0), 0);
    const mostUsed = usageData[0]?.packageName.split('.').pop() || 'None';

    return (
      <View style={styles.listHeader}>
        <FilterTabs
          activeRange={activeRange}
          onRangeChange={(range) => setActiveRange(range)}
        />
        <UsageOverview
          totalUsage={formatTime(totalMs)}
          mostUsedApp={mostUsed}
          mostLaunches={usageData.sort((a, b) => (b.appLaunchCount || 0) - (a.appLaunchCount || 0))[0]?.packageName.split('.').pop() || 'None'}
          launches={totalLaunches}
        />
        {usageData.length > 0 && (
          <UsageGraph data={usageData.map(app => ({
            name: app.packageName,
            usageTime: app.totalTimeInForeground
          }))} />
        )}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Details</Text>
          <Text style={styles.sectionSubtitle}>{usageData.length} apps tracked</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Usage</Text>
          <Text style={styles.headerSubtitle}>ReThink</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={fetchUsageStats}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={24} color={color.white} />
        </TouchableOpacity>
      </View>

      {error && <View style={styles.errorContainer}><Text style={styles.error}>{error}</Text></View>}

      {hasPermission === false && (
        <View style={styles.centerContent}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="lock-open-outline" size={40} color={color.primary} />
          </View>
          <Text style={styles.permissionTitle}>Permission Needed</Text>
          <Text style={styles.text}>
            We need Usage Access to provide insights into your digital habits.
          </Text>

          <TouchableOpacity style={styles.button} onPress={openPermissionSettings}>
            <Text style={styles.buttonText}>Enable Usage Access</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasPermission && (
        <FlatList
          data={usageData}
          renderItem={renderItem}
          keyExtractor={item => item.packageName}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={fetchUsageStats}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>
                No usage data found for this period
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.black,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 28,
    color: color.white,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: color.primary,
    fontWeight: '700',
    marginTop: -2,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  listHeader: {
    paddingBottom: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    color: color.white,
    fontWeight: '700',
    marginBottom: 8,
  },
  title: {
    marginLeft: 12,
    fontSize: 24,
    color: color.white,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 40,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemIconText: {
    color: color.white,
    fontSize: 18,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  packageName: {
    fontSize: 16,
    color: color.white,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  launchText: {
    fontSize: 12,
    color: color.secondary,
    marginLeft: 4,
  },
  itemStats: {
    marginLeft: 16,
    alignItems: 'flex-end',
  },
  usageTime: {
    fontSize: 17,
    color: color.primary,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: color.secondary,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: color.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    color: color.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    color: color.secondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    marginHorizontal: 24,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 82, 82, 0.2)',
  },
  error: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    backgroundColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: color.black,
    fontWeight: '800',
    fontSize: 16,
  },
})
