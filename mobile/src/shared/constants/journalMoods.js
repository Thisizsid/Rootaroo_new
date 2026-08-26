/**
 * The five moods the journal composer offers.
 *
 * Presented best → worst, which is why `score` runs downward through the
 * array: the row reads as a scale you slide along, but the History chart
 * plots the score, so the ordering the eye sees and the ordering the bars use
 * stay the same fact. `id` is the wire value — it must match `MOOD_VALUES` in
 * server/src/modules/journal/validation.ts.
 */
export const MOODS = [
  { id: 'happy', emoji: '😄', label: 'Happy', score: 5 },
  { id: 'calm', emoji: '🙂', label: 'Calm', score: 4 },
  { id: 'neutral', emoji: '😐', label: 'Okay', score: 3 },
  { id: 'low', emoji: '😔', label: 'Low', score: 2 },
  { id: 'rough', emoji: '😣', label: 'Rough', score: 1 },
];

const BY_ID = MOODS.reduce((map, mood) => {
  map[mood.id] = mood;
  return map;
}, {});

export function moodById(id) {
  return BY_ID[id] || null;
}

/** The top of the scale — what a mood's score is drawn as a fraction of. */
export const MAX_SCORE = Math.max(...MOODS.map((m) => m.score));
