import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
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
import { AppCategory } from '../../types/appLimits'

export default function AppScreen() {
  const navigation = useNavigation<any>()
  const {
    usageData,
    activeRange,
    setActiveRange,
    refreshUsage,
    isLoading,
    hasPermission,
    getAppCategory
  } = useUsage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | 'ALL'>('ALL');

  const categories: (AppCategory | 'ALL')[] = [
    'ALL',
    AppCategory.SOCIAL,
    AppCategory.ENTERTAINMENT,
    AppCategory.PRODUCTIVITY,
    AppCategory.GAMES,
    AppCategory.COMMUNICATION,
    AppCategory.OTHER
  ];

  const filteredAndSortedData = useMemo(() => {
    return usageData
      .filter(app => {
        const appName = (app.appName || app.packageName.split('.').pop() || '').toLowerCase();
        const matchesSearch = appName.includes(searchQuery.toLowerCase()) ||
          app.packageName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || getAppCategory(app.packageName) === selectedCategory;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => b.totalTimeInForeground - a.totalTimeInForeground);
  }, [usageData, searchQuery, selectedCategory, getAppCategory]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>All Usage</Text>
      <Text style={styles.subtitle}>{filteredAndSortedData.length} apps found</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.activeCategoryChip
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.activeCategoryChipText
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          data={filteredAndSortedData}
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
              <Ionicons name="search-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No matches found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginTop: 20,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: color.white,
    fontSize: 15,
    height: '100%',
  },
  categoryScroll: {
    marginTop: 16,
  },
  categoryContainer: {
    paddingRight: 24,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E1E',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  activeCategoryChip: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  categoryChipText: {
    color: color.secondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activeCategoryChipText: {
    color: color.black,
    fontWeight: '700',
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