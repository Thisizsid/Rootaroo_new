import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import FeatureTourShell from './FeatureTourShell';
import { Eyebrow, TourCard, TourAvatar, rowDivider } from './tourPrimitives';
import {
  day,
  dayBeats,
  calDays,
  calEvent,
  grocery,
  chat,
  chores,
  ping,
  checkins,
  bill,
  vault,
} from './featureTourContent';
import { colors, fonts, radius, withAlpha } from '../../shared/theme';

/**
 * Step 2 of 5 — the narrative heart of the tour. Eight timestamped beats of
 * one Tuesday, each pairing a plain-language line ("The milk runs out") with
 * a miniature of the screen that handles it.
 *
 * The miniatures are deliberately non-interactive: they are illustrations of
 * the product, not the product. Rendering them as real components would drag
 * live data, permissions and navigation into a screen whose only job is to
 * show what the app feels like.
 */
export default function FeatureDayScreen({ navigation }) {
  return (
    <FeatureTourShell
      step={1}
      navigation={navigation}
      footerDivider
      header={
        <>
          <Eyebrow>{day.eyebrow}</Eyebrow>
          <Text style={styles.title}>{day.title}</Text>
        </>
      }
      ctaLabel={day.cta}
      onContinue={() => navigation.navigate('FeatureHub')}
    >
      {dayBeats.map((beat, i) => (
        <Beat key={beat.kind} beat={beat} last={i === dayBeats.length - 1} />
      ))}
    </FeatureTourShell>
  );
}

/** One timeline row: time gutter, rule with a gold node, then the card. */
function Beat({ beat, last }) {
  return (
    <View style={styles.beat}>
      <View style={styles.gutter}>
        <Text style={styles.time}>{beat.time}</Text>
        <Text style={styles.meridiem}>{beat.meridiem}</Text>
      </View>
      <View style={[styles.track, last && styles.trackLast]}>
        <View style={styles.node} />
        <Text style={styles.beatTitle}>{beat.title}</Text>
        <Text style={styles.beatSub}>{beat.sub}</Text>
        <View style={styles.preview}>{PREVIEWS[beat.kind]()}</View>
        {last ? <Text style={styles.closing}>{day.closing}</Text> : null}
      </View>
    </View>
  );
}

/* ── The eight miniatures ─────────────────────────────────────────────── */

const PREVIEWS = {
  calendar: () => (
    <TourCard style={styles.pad}>
      <View style={styles.calRow}>
        {calDays.map((d) => (
          <View key={d.label} style={[styles.calDay, d.on && styles.calDayOn]}>
            <Text style={[styles.calLabel, d.on && styles.calLabelOn]}>{d.label}</Text>
            <Text style={[styles.calNum, d.on && styles.calNumOn]}>{d.num}</Text>
          </View>
        ))}
      </View>
      <View style={[styles.rowDivided, styles.calEvent]}>
        <View style={styles.eventBar} />
        <View style={styles.grow}>
          <Text style={styles.rowTitle}>{calEvent.title}</Text>
          <Text style={styles.rowMeta}>{calEvent.meta}</Text>
        </View>
        <TourAvatar name={calEvent.initial} size={24} />
      </View>
    </TourCard>
  ),

  grocery: () => (
    <TourCard style={styles.padList}>
      {grocery.map((g, i) => (
        <View key={g.name} style={[styles.listRow, i > 0 && styles.listRowDivided]}>
          <Checkbox done={g.done} />
          <Text
            style={[styles.grow, styles.rowTitle, g.done && styles.rowTitleDone]}
            numberOfLines={1}
          >
            {g.name}
          </Text>
          <Text style={styles.by}>{g.by}</Text>
        </View>
      ))}
    </TourCard>
  ),

  chat: () => (
    <View style={styles.chatWrap}>
      <View style={styles.outRow}>
        <LinearGradient
          colors={[colors.goldGlowSoft, colors.goldWarmDark]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.outBubble}
        >
          <Text style={styles.outText}>{chat.outgoing}</Text>
        </LinearGradient>
      </View>
      <View style={styles.inRow}>
        <TourAvatar name={chat.incomingInitial} size={24} />
        <View style={styles.inBubble}>
          <Text style={styles.inText}>{chat.incoming}</Text>
        </View>
      </View>
    </View>
  ),

  chores: () => (
    <TourCard style={styles.pad}>
      {chores.map((c, i) => (
        <View key={c.title} style={[styles.choreRow, i > 0 && styles.rowDivided]}>
          {c.done ? (
            <View style={styles.choreBoxOn}>
              <Tick color={goldOnTick} />
            </View>
          ) : (
            <View style={styles.choreBoxOff} />
          )}
          <View style={styles.grow}>
            <Text style={[styles.rowTitle, c.done && styles.rowTitleDone]}>{c.title}</Text>
            <Text style={styles.rowMeta}>{c.meta}</Text>
          </View>
          <TourAvatar name={c.initial} size={24} />
        </View>
      ))}
    </TourCard>
  ),

  ping: () => (
    <LinearGradient
      colors={[withAlpha(colors.goldGlow, 0.16), colors.surface, colors.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.pingCard}
    >
      <View style={styles.pingRow}>
        <View>
          <TourAvatar name={ping.initial} size={42} style={styles.pingAvatar} />
          <View style={styles.pingBadge}>
            <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 15Z"
                stroke={goldOnTick}
                strokeWidth={3}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </View>
        <View style={styles.grow}>
          <Text style={styles.pingTitle}>{ping.title}</Text>
          <Text style={styles.pingBody}>{ping.body}</Text>
        </View>
      </View>
    </LinearGradient>
  ),

  checkins: () => (
    <View style={styles.checkinRow}>
      {checkins.map((c, i) => (
        <TourCard
          key={`${c.initial}-${i}`}
          style={[styles.checkin, !c.home && styles.checkinAway]}
        >
          <View>
            <TourAvatar name={c.initial} size={34} />
            <View style={[styles.statusDot, { backgroundColor: c.home ? colors.successBright : colors.gold }]} />
          </View>
          <Text style={[styles.checkinState, !c.home && styles.checkinStateAway]}>{c.state}</Text>
        </TourCard>
      ))}
    </View>
  ),

  bill: () => (
    <TourCard style={styles.pad}>
      <View style={styles.billHead}>
        <View>
          <Text style={styles.microLabel}>{bill.label}</Text>
          <Text style={styles.billTotal}>{bill.total}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.microLabel}>{bill.owedLabel}</Text>
          <Text style={styles.billOwed}>{bill.owed}</Text>
        </View>
      </View>
      {/* Three bars, one per person — the split, at a glance. */}
      <View style={styles.splitRow}>
        <View style={[styles.splitBar, { backgroundColor: colors.gold }]} />
        <View style={[styles.splitBar, { backgroundColor: colors.avatarMoss }]} />
        <View style={[styles.splitBar, { backgroundColor: colors.avatarSlate }]} />
      </View>
    </TourCard>
  ),

  vault: () => (
    <TourCard style={styles.padList}>
      {vault.map((v, i) => (
        <View key={v.name} style={[styles.listRow, i > 0 && styles.listRowDivided]}>
          <View style={styles.vaultIcon}>
            <View style={styles.lockShackle} />
            <View style={styles.lockBody} />
          </View>
          <View style={styles.grow}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {v.name}
            </Text>
            <Text style={styles.rowMeta}>{v.meta}</Text>
          </View>
        </View>
      ))}
    </TourCard>
  ),
};

const goldOnTick = '#171208';

function Checkbox({ done }) {
  return (
    <View style={[styles.checkbox, done && styles.checkboxOn]}>
      {done ? <Tick color={goldOnTick} /> : null}
    </View>
  );
}

/** A checkmark drawn as SVG — the mock builds it from rotated borders. */
function Tick({ color }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l5 5 9-10" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.display,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: colors.ink,
    marginTop: 6,
  },

  beat: { flexDirection: 'row', gap: 14 },
  gutter: { width: 52, paddingTop: 2 },
  time: {
    fontFamily: fonts.mono,
    fontSize: 12,
    fontWeight: '800',
    color: colors.gold,
  },
  meridiem: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: colors.textFaint,
    marginTop: 3,
  },

  // The rule is the row's own left border, so it runs exactly as far as the
  // content beside it — no absolutely-positioned line to keep in sync.
  track: {
    flex: 1,
    minWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: withAlpha(colors.white, 0.07),
    paddingLeft: 16,
    paddingBottom: 22,
  },
  trackLast: { paddingBottom: 10 },
  node: {
    position: 'absolute',
    left: -4.5,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold,
  },

  beatTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    fontWeight: '700',
    color: colors.inkDeep,
  },
  beatSub: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 3,
  },
  preview: { marginTop: 11 },

  closing: {
    fontFamily: fonts.body,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    marginTop: 14,
  },

  /* Shared card internals */
  pad: { paddingHorizontal: 14, paddingVertical: 13 },
  padList: { paddingHorizontal: 14, paddingVertical: 4 },
  grow: { flex: 1, minWidth: 0 },
  right: { alignItems: 'flex-end' },
  rowTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  rowTitleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  rowMeta: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  rowDivided: {
    marginTop: 13,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: rowDivider,
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
  },
  listRowDivided: {
    borderTopWidth: 1,
    borderTopColor: rowDivider,
  },
  by: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },

  /* Calendar */
  calRow: { flexDirection: 'row', gap: 6 },
  calDay: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: withAlpha(colors.white, 0.03),
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.06),
    paddingVertical: 7,
    alignItems: 'center',
  },
  calDayOn: {
    backgroundColor: withAlpha(colors.gold, 0.18),
    borderColor: withAlpha(colors.gold, 0.6),
  },
  calLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.85,
    color: colors.textFaint,
  },
  calLabelOn: { color: colors.gold },
  calNum: {
    fontFamily: fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
    marginTop: 3,
  },
  calNumOn: { color: colors.goldGlowPale },
  calEvent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventBar: {
    width: 3,
    height: 30,
    borderRadius: 99,
    backgroundColor: colors.gold,
  },

  /* Grocery */
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: withAlpha(colors.white, 0.18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    borderColor: colors.gold,
    backgroundColor: colors.gold,
  },

  /* Chat */
  chatWrap: { gap: 9 },
  outRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  outBubble: {
    maxWidth: '84%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 5,
  },
  outText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: '#1A1408',
  },
  inRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 9 },
  inBubble: {
    maxWidth: '78%',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomLeftRadius: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: withAlpha(colors.white, 0.07),
  },
  inText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '600',
    color: colors.inkSoft,
  },

  /* Chores */
  choreRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  choreBoxOn: {
    width: 21,
    height: 21,
    borderRadius: 8,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choreBoxOff: {
    width: 21,
    height: 21,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: withAlpha(colors.white, 0.18),
  },

  /* Ping */
  pingCard: {
    borderRadius: radius.cardLg,
    borderWidth: 1.5,
    borderColor: withAlpha(colors.gold, 0.4),
    padding: 14,
    overflow: 'hidden',
  },
  pingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pingAvatar: {
    borderWidth: 2,
    borderColor: withAlpha(colors.gold, 0.5),
  },
  pingBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.goldSoft,
    borderWidth: 2.5,
    borderColor: colors.canvasBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingTitle: {
    fontFamily: fonts.display,
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.ink,
  },
  pingBody: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: 3,
  },

  /* Check-ins */
  checkinRow: { flexDirection: 'row', gap: 9 },
  checkin: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 7,
  },
  checkinAway: { borderColor: withAlpha(colors.gold, 0.28) },
  statusDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: colors.canvasBright,
  },
  checkinState: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  checkinStateAway: { color: colors.gold },

  /* Split bill */
  billHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  microLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: colors.textMuted,
  },
  billTotal: {
    fontFamily: fonts.mono,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.ink,
    marginTop: 7,
  },
  billOwed: {
    fontFamily: fonts.mono,
    fontSize: 19,
    fontWeight: '800',
    color: colors.successBright,
    marginTop: 7,
  },
  splitRow: { flexDirection: 'row', gap: 4, marginTop: 13 },
  splitBar: { flex: 1, height: 5, borderRadius: 99 },

  /* Vault */
  vaultIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(colors.gold, 0.24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockShackle: {
    width: 8,
    height: 5,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    borderColor: colors.gold,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginBottom: -1,
  },
  lockBody: {
    width: 13,
    height: 9,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },
});
