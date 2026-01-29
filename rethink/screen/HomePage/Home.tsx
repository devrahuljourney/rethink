import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { showUsageAccessSettings } from '@brighthustle/react-native-usage-stats-manager'
import { color } from '../../constant/color'
import FilterTabs from './components/FilterTabs'
import UsageOverview from './components/UsageOverview'
import UsageGraph from './components/UsageGraph'
import LaunchGraph from './components/LaunchGraph'
import { formatTime } from '../../utils/timeUtils'
import { useNavigation } from '@react-navigation/native'
import { useUsage } from '../../context/UsageContext'

export default function Home() {
  const navigation = useNavigation<any>()
  const {
    usageData,
    activeRange,
    setActiveRange,
    refreshUsage,
    isLoading,
    hasPermission,
    totalTodayMs,
    todayLauches,
    usageComparison
  } = useUsage();

  const openPermissionSettings = () => showUsageAccessSettings('')

  const renderStats = () => {
    const mostUsed = usageData[0]?.packageName.split('.').pop() || 'None';

    let comparisonText = '';
    if (activeRange === 'DAILY') {
      comparisonText = usageComparison > 0
        ? `Up ${usageComparison.toFixed(1)}% from yesterday`
        : usageComparison < 0
          ? `Down ${Math.abs(usageComparison).toFixed(1)}% from yesterday`
          : 'Same as yesterday';
    } else {
      const days = activeRange === 'WEEKLY' ? 7 : 30;
      comparisonText = `Avg: ${formatTime(totalTodayMs / days)} / day`;
    }

    return (
      <View style={{ paddingBottom: 40 }}>
        <FilterTabs
          activeRange={activeRange}
          onRangeChange={(range) => setActiveRange(range)}
        />
        <UsageOverview
          totalUsage={formatTime(totalTodayMs)}
          mostUsedApp={mostUsed}
          mostLaunches={usageData.sort((a, b) => (b.appLaunchCount || 0) - (a.appLaunchCount || 0))[0]?.packageName.split('.').pop() || 'None'}
          launches={todayLauches}
          activeRange={activeRange}
          avgUsage={comparisonText}
        />
        {usageData.length > 0 && (
          <>
            <UsageGraph data={usageData.slice(0, 5).map(app => ({
              name: app.appName || app.packageName.split('.').pop() || 'Unknown',
              usageTime: app.totalTimeInForeground
            }))} />
            <LaunchGraph data={usageData
              .filter(app => (app.appLaunchCount || 0) > 0)
              .sort((a, b) => (b.appLaunchCount || 0) - (a.appLaunchCount || 0))
              .slice(0, 5)
              .map(app => ({
                name: app.packageName.split('.').pop() || 'Unknown',
                launches: app.appLaunchCount || 0
              }))} />
          </>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.seeMoreButton}
            onPress={() => navigation.navigate('AppStack')}
          >
            <Text style={styles.seeMoreText}>View Detailed App Usage</Text>
            <Ionicons name="arrow-forward" size={18} color={color.primary} />
          </TouchableOpacity>
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
          onPress={refreshUsage}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={24} color={color.white} />
        </TouchableOpacity>
      </View>

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
          data={[]}
          renderItem={null}
          ListHeaderComponent={renderStats}
          refreshing={isLoading}
          onRefresh={refreshUsage}
          showsVerticalScrollIndicator={false}
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
  actionContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  seeMoreText: {
    color: color.white,
    fontSize: 15,
    fontWeight: '700',
    marginRight: 8,
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
