import React from 'react'
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
import { useNavigation } from '@react-navigation/native'
import { color } from '../../constant/color'
import FilterTabs from './components/FilterTabs'
import AppUsageItem from './components/AppUsageItem'
import { useUsage } from '../../context/UsageContext'
import { FilterRange } from '../../types/usage'

export default function AppScreen() {
  const navigation = useNavigation<any>()
  const {
    usageData,
    activeRange,
    setActiveRange,
    refreshUsage,
    isLoading,
    hasPermission
  } = useUsage();

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
          refreshing={isLoading}
          onRefresh={refreshUsage}
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