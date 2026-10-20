import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { showUsageAccessSettings } from '@brighthustle/react-native-usage-stats-manager'
import FilterTabs from './components/FilterTabs'
import DayBar, { Slice } from './components/DayBar'
import { formatTime } from '../../utils/timeUtils'
import { useNavigation } from '@react-navigation/native'
import { useUsage } from '../../context/UsageContext'
import { useFocusMode } from '../../context/FocusModeContext'
import GuardStatusBanner from '../Intervention/GuardStatusBanner'
import { Screen, Txt, Card, Sticker, PopButton, RoundButton } from '../../ui/kit'
import { CountUp, Pulse, Rise, Squish } from '../../ui/motion'
import { usePullRefresh } from '../../ui/usePullRefresh'
import { palette, font, stroke, TAB_BAR_SPACE } from '../../ui/theme'

type SplitBy = 'apps' | 'kinds'

const RANGE_LABEL = { DAILY: 'today', WEEKLY: 'last 7 days', MONTHLY: 'last 30 days' } as const

const greeting = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Up late.'
  if (h < 12) return 'Morning.'
  if (h < 17) return 'Afternoon.'
  return 'Evening.'
}

const todayLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

const shortName = (app: { appName?: string; packageName: string }) =>
  app.appName || app.packageName.split('.').pop() || 'Unknown'

export default function Home() {
  const navigation = useNavigation<any>()
  const {
    usageData,
    activeRange,
    setActiveRange,
    refreshUsage,
    hasPermission,
    totalTodayMs,
    todayLauches,
    usageComparison,
    categoryStats,
  } = useUsage();
  const { focusModes } = useFocusMode();
  const pull = usePullRefresh(refreshUsage);
  const [splitBy, setSplitBy] = useState<SplitBy>('apps');

  const activeFocusCount = focusModes.filter(m => m.enabled).length;
  const days = activeRange === 'WEEKLY' ? 7 : activeRange === 'MONTHLY' ? 30 : 1;

  const slices: Slice[] = useMemo(
    () =>
      splitBy === 'apps'
        ? usageData.map(a => ({ key: a.packageName, label: shortName(a), ms: a.totalTimeInForeground }))
        : categoryStats.map(c => ({ key: c.category, label: c.category, ms: c.totalUsageMs })),
    [splitBy, usageData, categoryStats],
  );

  // Long totals ("112h 30m") step down so they stay on one line.
  const totalText = formatTime(totalTodayMs)
  const totalSize = totalText.length <= 7 ? styles.totalXL : totalText.length <= 9 ? styles.totalL : styles.totalM

  const renderComparison = () => {
    if (activeRange !== 'DAILY') {
      return <Sticker text={`~${formatTime(totalTodayMs / days)} a day`} tone="lilac" tilt={-4} delay={500} />
    }
    const pct = Math.abs(usageComparison).toFixed(0)
    if (usageComparison > 0) return <Sticker text={`${pct}% vs yesterday`} icon="arrow-up" tone="tomato" tilt={-4} delay={500} />
    if (usageComparison < 0) return <Sticker text={`${pct}% vs yesterday`} icon="arrow-down" tone="mint" tilt={-4} delay={500} />
    return <Sticker text="same as yesterday" tone="lilac" tilt={-4} delay={500} />
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Rise>
          <Txt v="label">{todayLabel()}</Txt>
          <Txt v="display" style={{ marginTop: 2 }}>{greeting()}</Txt>
        </Rise>
        <RoundButton icon="refresh" label="Refresh usage" onPress={refreshUsage} />
      </View>

      {hasPermission === false && (
        <View style={styles.permissionWrap}>
          <Rise>
            <Card style={{ padding: 22 }}>
              <Sticker text="one quick step" tone="tomato" tilt={-4} style={{ marginBottom: 16 }} />
              <Txt v="h1">Let Rethink see your screen time</Txt>
              <Txt style={{ marginTop: 8, marginBottom: 22 }}>
                Android keeps usage stats behind a switch. Turn on Usage Access for Rethink and this screen fills up with
                your real numbers.
              </Txt>
              <PopButton title="Open Usage Access" icon="arrow-forward" tone="sun" onPress={() => showUsageAccessSettings('')} />
            </Card>
          </Rise>
        </View>
      )}

      {hasPermission && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
          refreshControl={
            <RefreshControl
              refreshing={pull.refreshing}
              onRefresh={pull.onRefresh}
              colors={[palette.ink]}
              tintColor={palette.ink}
              progressBackgroundColor={palette.sun}
            />
          }
        >
          <GuardStatusBanner />

          <Rise delay={40} style={styles.gutter}>
            <FilterTabs activeRange={activeRange} onRangeChange={setActiveRange} />
          </Rise>

          {/* Hero: the number sits straight on the paper, no card. */}
          <View style={[styles.gutter, styles.hero]}>
            <Rise delay={80}>
              <Txt v="label">Screen time · {RANGE_LABEL[activeRange]}</Txt>
            </Rise>
            <Rise delay={120}>
              <CountUp
                key={activeRange}
                value={totalTodayMs}
                format={n => formatTime(n)}
                style={[styles.total, totalSize]}
              />
            </Rise>
            {renderComparison()}
            <Rise delay={200}>
              <Text style={styles.heroLine}>
                <Text style={styles.heroStrong}>{todayLauches}</Text> opens
                {usageData[0] ? (
                  <>
                    {'  ·  '}most of it in <Text style={styles.heroStrong}>{shortName(usageData[0])}</Text>
                  </>
                ) : null}
              </Text>
            </Rise>
          </View>

          {slices.length > 0 && (
            <Rise delay={260} style={[styles.gutter, styles.section]}>
              <View style={styles.splitHeader}>
                <Txt v="h2">Where it went</Txt>
                <View style={styles.splitToggle}>
                  {(['apps', 'kinds'] as SplitBy[]).map(opt => (
                    <Pressable
                      key={opt}
                      onPress={() => setSplitBy(opt)}
                      hitSlop={8}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: splitBy === opt }}
                    >
                      <Text style={[styles.splitOption, splitBy === opt && styles.splitOptionOn]}>
                        {opt === 'apps' ? 'Apps' : 'Kinds'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <DayBar key={`${splitBy}-${activeRange}`} slices={slices} />
              <Squish
                onPress={() => navigation.navigate('AppStack', { screen: 'App' })}
                accessibilityRole="button"
                style={styles.allApps}
              >
                <Text style={styles.allAppsText}>Every app, one by one</Text>
                <Ionicons name="arrow-forward" size={18} color={palette.ink} />
              </Squish>
            </Rise>
          )}

          <Rise delay={340} style={[styles.gutter, styles.section]}>
            <Squish
              onPress={() => navigation.navigate('FocusStack')}
              accessibilityRole="button"
              style={styles.focusRow}
            >
              <Ionicons name="moon" size={22} color={palette.ink} />
              <View style={styles.focusText}>
                <Txt v="h3">Focus mode</Txt>
                <Txt v="small" style={{ color: palette.ink }}>
                  {activeFocusCount > 0
                    ? `${activeFocusCount} schedule${activeFocusCount > 1 ? 's' : ''} running`
                    : 'Mute the loud apps on a schedule'}
                </Txt>
              </View>
              {activeFocusCount > 0 && (
                <View style={styles.onBadge}>
                  <Pulse style={styles.onDot}><View /></Pulse>
                  <Text style={styles.onText}>on</Text>
                </View>
              )}
              <Ionicons name="arrow-forward" size={20} color={palette.ink} />
            </Squish>
          </Rise>
        </ScrollView>
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 18,
  },
  gutter: {
    marginHorizontal: 20,
  },
  section: {
    marginBottom: 36,
  },
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: TAB_BAR_SPACE,
  },

  hero: {
    marginTop: 30,
    marginBottom: 40,
  },
  total: {
    fontFamily: font.display,
    color: palette.ink,
    letterSpacing: -3,
    marginTop: 4,
    marginBottom: 10,
  },
  totalXL: { fontSize: 84, lineHeight: 88 },
  totalL: { fontSize: 66, lineHeight: 72 },
  totalM: { fontSize: 52, lineHeight: 58 },
  heroLine: {
    fontFamily: font.body,
    fontSize: 16,
    color: palette.inkSoft,
    marginTop: 14,
  },
  heroStrong: {
    fontFamily: font.bodyBold,
    color: palette.ink,
    textTransform: 'capitalize',
  },

  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  splitToggle: {
    flexDirection: 'row',
    gap: 14,
  },
  splitOption: {
    fontFamily: font.bodyBold,
    fontSize: 14,
    color: palette.inkFaint,
  },
  splitOptionOn: {
    color: palette.ink,
    textDecorationLine: 'underline',
  },
  allApps: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 22,
  },
  allAppsText: {
    fontFamily: font.bodyBold,
    fontSize: 15,
    color: palette.ink,
  },

  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: stroke,
    borderColor: palette.ink,
    backgroundColor: palette.tomato,
  },
  focusText: {
    flex: 1,
  },
  onBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.ink,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.mint,
  },
  onText: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    color: palette.card,
  },
})
