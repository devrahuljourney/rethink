import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { showUsageAccessSettings } from '@brighthustle/react-native-usage-stats-manager'
import DayBar, { Slice } from './components/DayBar'
import DayDial, { hourRange } from './components/DayDial'
import SelectionPanel from './components/SelectionPanel'
import WeekStrip from './components/WeekStrip'
import FilterTabs from './components/FilterTabs'
import MonthGrid from './components/MonthGrid'
import { formatTime, getStartOfDay } from '../../utils/timeUtils'
import { useDayRhythm } from '../../utils/useDayRhythm'
import { TimeWindow, useWindowApps } from '../../utils/useWindowApps'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { useUsage } from '../../context/UsageContext'
import { useFocusMode } from '../../context/FocusModeContext'
import { useAuth } from '../../context/AuthContext'
import GuardStatusBanner from '../Intervention/GuardStatusBanner'
import { Screen, Txt, Card, PopButton } from '../../ui/kit'
import { CountUp, Rise, Squish, Pulse } from '../../ui/motion'
import { usePullRefresh } from '../../ui/usePullRefresh'
import { palette, font, TAB_BAR_SPACE } from '../../ui/theme'

const QUIET_MS = 5 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

/** What the user tapped: an hour on today's dial, or a whole day (from the week strip, week chart or calendar). */
type Pick = { kind: 'hour'; hour: number } | { kind: 'day'; start: number }

const nextMidnight = (start: number) => {
  const d = new Date(start)
  d.setDate(d.getDate() + 1)
  return d.getTime()
}

const pickWindow = (pick: Pick): TimeWindow => {
  const now = Date.now()
  if (pick.kind === 'hour') {
    const start = getStartOfDay() + pick.hour * HOUR_MS
    return { start, end: Math.min(start + HOUR_MS - 1, now) }
  }
  return { start: pick.start, end: Math.min(nextMidnight(pick.start) - 1, now) }
}

const pickTitle = (pick: Pick) => {
  if (pick.kind === 'hour') return `${hourRange(pick.hour)} today`
  if (pick.start === getStartOfDay()) return 'Today so far'
  return new Date(pick.start).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
}
const RANGE_META = { DAILY: 'today', WEEKLY: 'last 7 days', MONTHLY: 'last 30 days' } as const

const greeting = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const dateLabel = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`

const dayLabel = (start: number) => new Date(start).toLocaleDateString('en-GB', { weekday: 'short' })

const trimHour = (t: string) => t.replace(/^0(\d)/, '$1')

const shortName = (app: { appName?: string; packageName: string }) =>
  app.appName || app.packageName.split('.').pop() || 'Unknown'

export default function Home() {
  const navigation = useNavigation<any>()
  const { width } = useWindowDimensions()
  const { user } = useAuth()
  const {
    usageData,
    activeRange,
    setActiveRange,
    refreshUsage,
    hasPermission,
    usageComparison,
    todayLauches,
  } = useUsage();
  const { focusModes } = useFocusMode();
  const { rhythm, reloadRhythm } = useDayRhythm();

  // Replay the entrance every time Home comes back into view, not just on first mount.
  const isFocused = useIsFocused()
  const [play, setPlay] = useState(0)
  useEffect(() => {
    if (isFocused) setPlay(p => p + 1)
  }, [isFocused])
  const scene = `${activeRange}-${play}`

  // Tapped hour/day, cleared whenever the range changes.
  const [pick, setPick] = useState<Pick | null>(null)
  useEffect(() => setPick(null), [activeRange])
  const pickWin = useMemo(() => (pick ? pickWindow(pick) : null), [pick])
  const { apps: pickApps, loading: pickLoading } = useWindowApps(pickWin)
  const selectedDay = pick?.kind === 'day' ? pick.start : null

  const openApp = useCallback(
    (packageName: string) => navigation.navigate('AppStack', { screen: 'AppDetails', params: { packageName } }),
    [navigation],
  )
  const panel = pick ? (
    <SelectionPanel
      title={pickTitle(pick)}
      apps={pickApps}
      loading={pickLoading}
      onClose={() => setPick(null)}
      onOpenApp={openApp}
    />
  ) : null

  const refreshAll = useCallback(() => Promise.all([refreshUsage(), reloadRhythm()]), [refreshUsage, reloadRhythm]);
  const pull = usePullRefresh(refreshAll);

  const firstName = (user?.name || '').trim().split(/\s+/)[0]
  const activeFocus = focusModes.filter(m => m.enabled)
  const focusSchedule = activeFocus[0]?.schedules?.[0]
  const dialSize = Math.min(width - 40, 340)

  const slices: Slice[] = useMemo(
    () => usageData.map(a => ({ key: a.packageName, label: shortName(a), ms: a.totalTimeInForeground })),
    [usageData],
  );

  // Facts read straight off today's hours.
  const facts = useMemo(() => {
    if (!rhythm) return null
    const passed = rhythm.hours.filter((h): h is number => h !== null)

    let peak = -1
    passed.forEach((ms, i) => { if (ms > 0 && (peak < 0 || ms > passed[peak])) peak = i })

    // Finished hours only, so the current hour can't end a streak early.
    let best = 0
    let run = 0
    passed.slice(0, -1).forEach(ms => {
      run = ms < QUIET_MS ? run + 1 : 0
      best = Math.max(best, run)
    })

    const minutesSoFar = (Date.now() - getStartOfDay()) / 60000
    const every = rhythm.opens > 0 ? Math.max(1, Math.round(minutesSoFar / rhythm.opens)) : 0

    return { peak, peakMs: peak >= 0 ? passed[peak] : 0, quietHours: best, every }
  }, [rhythm])

  // Week and month facts come from whole days.
  const span = useMemo(() => {
    if (!rhythm || activeRange === 'DAILY') return null
    const days = activeRange === 'WEEKLY' ? rhythm.week : rhythm.month
    const total = days.reduce((a, d) => a + d.ms, 0)
    const finished = days.slice(0, -1).filter(d => d.ms > 0)
    const busiest = days.reduce((a, d) => (d.ms > a.ms ? d : a), days[0])
    const lightest = finished.length ? finished.reduce((a, d) => (d.ms < a.ms ? d : a), finished[0]) : null
    return { days, total, avg: total / days.length, busiest, lightest }
  }, [rhythm, activeRange])

  const pastWeek = rhythm ? rhythm.week.slice(0, -1) : []
  const weekAvg = pastWeek.length ? pastWeek.reduce((a, d) => a + d.ms, 0) / pastWeek.length : 0

  const comparison =
    usageComparison > 0
      ? { text: `↑ ${usageComparison.toFixed(0)}% vs yesterday`, color: palette.tomato }
      : usageComparison < 0
        ? { text: `↓ ${Math.abs(usageComparison).toFixed(0)}% vs yesterday`, color: '#1F8A62' }
        : { text: 'same as yesterday', color: palette.inkSoft }

  return (
    <Screen>
      <View style={styles.header}>
        <Rise style={{ flex: 1 }}>
          <Txt v="label">{dateLabel()}</Txt>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting()}{firstName ? `, ${firstName}` : ''}<Text style={{ color: palette.tomato }}>.</Text>
          </Text>
        </Rise>
        <Squish onPress={refreshAll} accessibilityRole="button" accessibilityLabel="Refresh" hitSlop={10} style={styles.refresh}>
          <Ionicons name="refresh" size={20} color={palette.ink} />
        </Squish>
      </View>

      {hasPermission === false && (
        <View style={styles.permissionWrap}>
          <Rise>
            <Card style={{ padding: 22 }}>
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
              progressBackgroundColor={palette.card}
            />
          }
        >
          <GuardStatusBanner />

          <Rise delay={20} style={[styles.gutter, styles.rangeWrap]}>
            <FilterTabs activeRange={activeRange} onRangeChange={setActiveRange} />
          </Rise>

          {!rhythm && (
            <View style={[styles.dialWrap, { height: dialSize }]}>
              <ActivityIndicator color={palette.ink} />
            </View>
          )}

          {/* Today: the day as a clock face. */}
          {rhythm && activeRange === 'DAILY' && (
            <View key={scene}>
              <View style={[styles.dialWrap, { height: dialSize }]}>
                <DayDial
                  hours={rhythm.hours}
                  size={dialSize}
                  caption={comparison.text}
                  captionColor={comparison.color}
                  selected={pick?.kind === 'hour' ? pick.hour : null}
                  onSelect={h => setPick(h === null ? null : { kind: 'hour', hour: h })}
                />
              </View>
              {pick?.kind === 'hour' && <View style={styles.gutter}>{panel}</View>}
              {!pick && (
                <Text style={styles.hint}>Tap an hour, a day or a date to see what happened.</Text>
              )}

              {facts && (
                <View style={[styles.gutter, styles.facts]}>
                  <Rise delay={500} style={styles.fact}>
                    <Txt v="label">Peak hour</Txt>
                    <Text style={styles.factValue}>{facts.peak >= 0 ? hourLabel(facts.peak) : '—'}</Text>
                    <Text style={styles.factSub}>{facts.peak >= 0 ? `${formatTime(facts.peakMs)} used` : 'nothing yet'}</Text>
                  </Rise>
                  <Rise delay={580} style={[styles.fact, styles.factRule]}>
                    <Txt v="label">Opens</Txt>
                    <Text style={styles.factValue}>{rhythm.opens}</Text>
                    <Text style={styles.factSub}>{facts.every ? `every ${facts.every} min` : 'none yet'}</Text>
                  </Rise>
                  <Rise delay={660} style={[styles.fact, styles.factRule]}>
                    <Txt v="label">Off phone</Txt>
                    <Text style={styles.factValue}>{facts.quietHours ? `${facts.quietHours}h` : '—'}</Text>
                    <Text style={styles.factSub}>longest stretch</Text>
                  </Rise>
                </View>
              )}

              <Rise delay={720} style={[styles.gutter, styles.section]}>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>This week</Text>
                  <Text style={styles.sectionMeta}>avg {formatTime(weekAvg)} a day</Text>
                </View>
                <WeekStrip
                  week={rhythm.week}
                  selected={selectedDay !== null ? rhythm.week.findIndex(d => d.start === selectedDay) : null}
                  onSelect={i => setPick(i === null ? null : { kind: 'day', start: rhythm.week[i].start })}
                />
                {pick?.kind === 'day' && panel}
              </Rise>
            </View>
          )}

          {/* Week and month: a big total, then the days themselves. */}
          {span && (
            <View key={scene} style={styles.gutter}>
              <Rise delay={60} style={styles.spanHead}>
                <Txt v="label">Screen time · {RANGE_META[activeRange]}</Txt>
                <CountUp value={span.total} format={n => formatTime(n)} style={styles.spanTotal} />
                <Text style={styles.spanSub}>
                  about <Text style={styles.spanStrong}>{formatTime(span.avg)}</Text> a day
                </Text>
              </Rise>

              <Rise delay={140}>
                {activeRange === 'WEEKLY' ? (
                  <WeekStrip
                    week={span.days}
                    height={170}
                    barWidth={22}
                    showValues
                    selected={selectedDay !== null ? span.days.findIndex(d => d.start === selectedDay) : null}
                    onSelect={i => setPick(i === null ? null : { kind: 'day', start: span.days[i].start })}
                  />
                ) : (
                  <MonthGrid
                    month={span.days}
                    width={width - 40}
                    selected={selectedDay}
                    onSelect={start => setPick(start === null ? null : { kind: 'day', start })}
                  />
                )}
                {panel}
              </Rise>

              <View style={styles.facts}>
                <Rise delay={500} style={styles.fact}>
                  <Txt v="label">Heaviest</Txt>
                  <Text style={styles.factValue}>{dayLabel(span.busiest.start)}</Text>
                  <Text style={styles.factSub}>
                    {activeRange === 'MONTHLY' ? `${new Date(span.busiest.start).getDate()} · ` : ''}{formatTime(span.busiest.ms)}
                  </Text>
                </Rise>
                <Rise delay={580} style={[styles.fact, styles.factRule]}>
                  <Txt v="label">Lightest</Txt>
                  <Text style={styles.factValue}>
                    {span.lightest ? dayLabel(span.lightest.start) : '—'}
                  </Text>
                  <Text style={styles.factSub}>
                    {span.lightest
                      ? `${activeRange === 'MONTHLY' ? `${new Date(span.lightest.start).getDate()} · ` : ''}${formatTime(span.lightest.ms)}`
                      : 'not enough days'}
                  </Text>
                </Rise>
                <Rise delay={660} style={[styles.fact, styles.factRule]}>
                  <Txt v="label">Opens</Txt>
                  <Text style={styles.factValue}>{todayLauches}</Text>
                  <Text style={styles.factSub}>~{Math.round(todayLauches / span.days.length)} a day</Text>
                </Rise>
              </View>
            </View>
          )}

          {slices.length > 0 && (
            <Rise key={`bd-${scene}`} delay={800} style={[styles.gutter, styles.section]}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>Where it went</Text>
                <Text style={styles.sectionMeta}>{RANGE_META[activeRange]}</Text>
              </View>
              <DayBar
                key={scene}
                slices={slices}
                onPressRow={key => (key === '__rest' ? navigation.navigate('AppStack', { screen: 'App' }) : openApp(key))}
              />
              <Squish
                onPress={() => navigation.navigate('AppStack', { screen: 'App' })}
                accessibilityRole="button"
                style={styles.link}
              >
                <Text style={styles.linkText}>See every app</Text>
                <Ionicons name="arrow-forward" size={16} color={palette.ink} />
              </Squish>
            </Rise>
          )}

          <Rise key={`fo-${scene}`} delay={880} style={[styles.gutter, styles.section]}>
            <Squish
              onPress={() => navigation.navigate('FocusStack')}
              accessibilityRole="button"
              scaleTo={0.98}
              style={styles.focusRow}
            >
              <View style={[styles.focusIcon, { backgroundColor: activeFocus.length ? palette.mint : palette.line }]}>
                <Ionicons name="moon" size={18} color={palette.ink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.focusTitle}>Focus</Text>
                <Text style={styles.focusSub} numberOfLines={1}>
                  {focusSchedule
                    ? `${trimHour(focusSchedule.startTime)}–${trimHour(focusSchedule.endTime)} · ${activeFocus[0].name}`
                    : 'No quiet hours set'}
                </Text>
              </View>
              {activeFocus.length > 0 ? (
                <View style={styles.onBadge}>
                  <Pulse style={styles.onDot}><View /></Pulse>
                  <Text style={styles.onText}>On</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={palette.inkSoft} />
              )}
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
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
  },
  greeting: {
    fontFamily: font.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
    color: palette.ink,
    marginTop: 4,
  },
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.line,
    marginLeft: 12,
    marginBottom: 2,
  },
  gutter: {
    marginHorizontal: 20,
  },
  section: {
    marginTop: 40,
  },
  permissionWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: TAB_BAR_SPACE,
  },

  dialWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  facts: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: palette.line,
  },
  fact: {
    flex: 1,
  },
  factRule: {
    paddingLeft: 12,
    marginLeft: 12,
    borderLeftWidth: 1,
    borderColor: palette.line,
  },
  factValue: {
    fontFamily: font.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: palette.ink,
    marginTop: 6,
  },
  factSub: {
    fontFamily: font.body,
    fontSize: 12,
    lineHeight: 16,
    color: palette.inkSoft,
    marginTop: 2,
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    fontFamily: font.displayBold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: palette.ink,
  },
  sectionMeta: {
    fontFamily: font.mono,
    fontSize: 11,
    color: palette.inkSoft,
  },
  rangeWrap: {
    marginTop: 14,
  },
  hint: {
    fontFamily: font.body,
    fontSize: 12,
    color: palette.inkFaint,
    textAlign: 'center',
    marginTop: 4,
  },
  spanHead: {
    marginTop: 30,
    marginBottom: 26,
  },
  spanTotal: {
    fontFamily: font.display,
    fontSize: 56,
    lineHeight: 62,
    letterSpacing: -2,
    color: palette.ink,
    marginTop: 6,
  },
  spanSub: {
    fontFamily: font.body,
    fontSize: 15,
    color: palette.inkSoft,
    marginTop: 2,
  },
  spanStrong: {
    fontFamily: font.bodyBold,
    color: palette.ink,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 20,
  },
  linkText: {
    fontFamily: font.bodyBold,
    fontSize: 14,
    color: palette.ink,
  },

  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: palette.ink,
    backgroundColor: palette.card,
  },
  focusIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  focusTitle: {
    fontFamily: font.bodyBold,
    fontSize: 16,
    color: palette.ink,
  },
  focusSub: {
    fontFamily: font.body,
    fontSize: 13,
    color: palette.inkSoft,
    marginTop: 1,
  },
  onBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.mint,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  onDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.ink,
  },
  onText: {
    fontFamily: font.bodyBold,
    fontSize: 12,
    color: palette.ink,
  },
})
