export * from './lib/errors/errorTypes';
export * from './lib/errors/errors';
export * from './lib/config/timers';
export * from './lib/config/urls';
export * from './lib/config/worldSettings';
export * from './lib/logger/logger';
export * from './lib/utils/functional';
export * from './lib/internal-events';

export type WithRequired<Type, Key extends keyof Type> = Type & Required<Pick<Type, Key>>;

export const quantityFormatter = new Intl.NumberFormat('en', {
  minimumFractionDigits: 2,
  notation: 'compact',
  compactDisplay: 'short',
});
