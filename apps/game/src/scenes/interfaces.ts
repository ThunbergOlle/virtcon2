
export interface SceneStates {
  create: () => void;
  update: (t: number, dt: number) => void;
  preload: () => void;
}
