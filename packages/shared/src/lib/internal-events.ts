export const INTERNAL_EVENTS = {
  EXPAND_PLOT: 'EXPAND_PLOT',
} as const;

export type InternalEventType = keyof typeof INTERNAL_EVENTS;
