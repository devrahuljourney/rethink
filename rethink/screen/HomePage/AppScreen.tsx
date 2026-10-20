import React, { useState, useMemo } from 'react'
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ScrollView,
  RefreshControl,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { showUsageAccessSettings } from '@brighthustle/react-native-usage-stats-manager'
import { useNavigation } from '@react-navigation/native'
import { Screen, Txt, Field, Chip, Sticker, Card, PopButton } from '../../ui/kit'
import { usePullRefresh } from '../../ui/usePullRefresh'
import { palette, TAB_BAR_SPACE } from '../../ui/theme'
import { Rise } from '../../ui/motion'
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
    hasPermission,
    getAppCategory
  } = useUsage();

  const [searchQuery, setSearchQuery] = useState('');
  const pull = usePullRefresh(refreshUsage);
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

  // Built as an element (not a component) so the search field keeps focus while typing.
  const header = (
    <View style={styles.header}>
      <Rise style={styles.titleRow}>
        <Txt v="display">Apps</Txt>
        <Sticker text={`${filteredAndSortedData.length} found`} tone="mint" tilt={-6} style={{ marginLeft: 12 }} />
      </Rise>

      <Field
        icon="search"
        placeholder="Find an app"
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCorrect={false}
        style={{ marginTop: 18 }}
        right={
          searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={palette.ink} />
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map(category => (
          <Chip
            key={category}
            label={category === 'ALL' ? 'All' : category}
            active={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
          />
        ))}
      </ScrollView>

      <FilterTabs
        activeRange={activeRange}
        onRangeChange={(range: FilterRange) => setActiveRange(range)}
        style={{ marginTop: 16 }}
      />
    </View>
  )

  return (
    <Screen>
      {hasPermission === false ? (
        <View style={styles.centerContent}>
          <Card style={{ padding: 22 }}>
            <Txt v="h1">Nothing to list yet</Txt>
            <Txt style={{ marginTop: 8, marginBottom: 20 }}>
              Turn on Usage Access for Rethink and every app you use shows up here.
            </Txt>
            <PopButton title="Open Usage Access" tone="sun" icon="arrow-forward" onPress={() => showUsageAccessSettings('')} />
          </Card>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedData}
          keyExtractor={(item) => item.packageName}
          renderItem={({ item, index }) => (
            <AppUsageItem
              item={item}
              index={index}
              onPress={() => navigation.navigate('AppDetails', { packageName: item.packageName })}
            />
          )}
          ListHeaderComponent={header}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={pull.refreshing}
              onRefresh={pull.onRefresh}
              colors={[palette.ink]}
              tintColor={palette.ink}
              progressBackgroundColor={palette.mint}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Txt v="h2">No app by that name</Txt>
              <Txt style={{ marginTop: 4 }}>Try fewer letters, or switch to All.</Txt>
            </View>
          }
        />
      )}
    </Screen>
  )
}


const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryScroll: {
    marginTop: 14,
    marginHorizontal: -20,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: TAB_BAR_SPACE,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: TAB_BAR_SPACE,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
})
