import React, { useState, useEffect } from 'react'
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
  checkForPermission,
  queryAndAggregateUsageStats,
  showUsageAccessSettings,
} from '@brighthustle/react-native-usage-stats-manager'
import { useNavigation } from '@react-navigation/native'
import { color } from '../../constant/color'
import FilterTabs from './components/FilterTabs'
import AppUsageItem from './components/AppUsageItem'
import { AppUsageStats, FilterRange } from '../../types/usage'

export default function AppScreen() {
  const navigation = useNavigation<any>()
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [usageData, setUsageData] = useState<AppUsageStats[]>([])
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeRange, setActiveRange] = useState<FilterRange>('DAILY')

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setError('Usage stats are only available on Android')
      return
    }
    checkPermission()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkPermission()
    })
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (hasPermission) fetchUsageStats()
  }, [activeRange, hasPermission])

  const checkPermission = async () => {
    try {
      const granted = await checkForPermission()
      setHasPermission(granted)
      if (granted) fetchUsageStats()
    } catch (e) {
      setError('Permission check failed')
    }
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

      const rawResult = await queryAndAggregateUsageStats(startMilliseconds, endMilliseconds)
      const usageArray: AppUsageStats[] = Object.values(rawResult as any)
      const filteredResult = usageArray
        .filter(app => app.totalTimeInForeground > 0 && !app.isSystem)
        .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground)

      setUsageData(filteredResult)
    } catch (e) {
      setError('Failed to fetch usage stats')
    } finally {
      setRefreshing(false)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>All Usage</Text>
      <Text style={styles.subtitle}>{usageData.length} active apps</Text>
      <View style={styles.filterWrapper}>
        <FilterTabs
          activeRange={activeRange}
          onRangeChange={(range: FilterRange) => setActiveRange(range)}
        />
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {hasPermission === false ? (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Permission required to view list</Text>
          <TouchableOpacity style={styles.button} onPress={() => showUsageAccessSettings('')}>
            <Text style={styles.buttonText}>Enable Access</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={usageData}
          keyExtractor={(item) => item.packageName}
          renderItem={({ item }) => (
            <AppUsageItem
              item={item}
              onPress={() => navigation.navigate('AppDetails', { packageName: item.packageName })}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={fetchUsageStats}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="apps-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No apps found</Text>
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
    padding: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    color: color.white,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    color: color.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  filterWrapper: {
    marginTop: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: color.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: color.primary,
  },
  buttonText: {
    color: color.black,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: color.secondary,
    marginTop: 16,
    fontSize: 16,
  }
})