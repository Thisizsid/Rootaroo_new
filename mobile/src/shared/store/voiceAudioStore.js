import { create } from 'zustand';

// Coordinates voice-note playback across every VoiceBubble on screen — only
// one clip should ever play at a time. Each bubble watches `activeMessageId`
// and pauses itself when a different message becomes active, instead of
// each bubble's Audio.Sound running fully independently.
export const useVoiceAudioStore = create((set, get) => ({
  activeMessageId: null,
  setActive: (id) => set({ activeMessageId: id }),
  // Only clears if this id is still the active one — avoids a stale clear
  // (e.g. from a pause that resolved after a different bubble already
  // started playing) wiping out the new active id.
  clearActive: (id) => {
    if (get().activeMessageId === id) set({ activeMessageId: null });
  },
}));
