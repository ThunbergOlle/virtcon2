export const ui8 = Symbol('ui8');
export const ui16 = Symbol('ui16');
export const ui32 = Symbol('ui32');

export const i16 = Symbol('i16');
export const i32 = Symbol('i32');

export type ComponentType = typeof ui8 | typeof ui16 | typeof ui32 | typeof i16 | typeof i32;
