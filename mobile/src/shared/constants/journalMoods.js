/**
 * The five moods the journal composer offers.
 *
 * Presented best → worst, which is why `score` runs downward through the
 * array: the row reads as a scale you slide along, but the History chart
 * plots the score, so the ordering the eye sees and the ordering the bars use
 * stay the same fact. `id` is the wire value — it must match `MOOD_VALUES` in
 * server/src/modules/journal/validation.ts.
 *
 * `icon` is a MaterialCommunityIcons glyph name, not an emoji: emoji render in
 * the platform's own font, which means a different face on iOS than on Android
 * and no way to tint one gold when it is selected. A glyph is monochrome, takes
 * the app's colour tokens, and looks the same everywhere.
 */
export const MOODS = [
  { id: 'happy', icon: 'emoticon-excited-outline', label: 'Happy', score: 5 },
  { id: 'calm', icon: 'emoticon-happy-outline', label: 'Calm', score: 4 },
  { id: 'neutral', icon: 'emoticon-neutral-outline', label: 'Okay', score: 3 },
  { id: 'low', icon: 'emoticon-sad-outline', label: 'Low', score: 2 },
  { id: 'rough', icon: 'emoticon-cry-outline', label: 'Rough', score: 1 },
];

/** Shown for an entry saved without a mood. */
export const NO_MOOD_ICON = 'text-box-outline';

const BY_ID = MOODS.reduce((map, mood) => {
  map[mood.id] = mood;
  return map;
}, {});

export function moodById(id) {
  return BY_ID[id] || null;
}

/** The glyph for a mood id, falling back to the no-mood mark. */
export function moodIcon(id) {
  return BY_ID[id]?.icon || NO_MOOD_ICON;
}

/** The top of the scale — what a mood's score is drawn as a fraction of. */
export const MAX_SCORE = Math.max(...MOODS.map((m) => m.score));
