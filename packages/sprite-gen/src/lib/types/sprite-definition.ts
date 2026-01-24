export interface SpriteMeta {
  name: string;
  canvas: [number, number]; // [width, height]
  origin?: [number, number];
}

export interface Palette {
  [colorName: string]: string; // hex colors
}

export interface PartDefinition {
  at?: [number, number];
  anchor?: [number, number];
  pattern?: string;
  palette?: Record<string, string>;
}

export interface SpriteTemplate {
  size?: [number, number];
  params?: string[];
  parts?: PartDefinition[];
}

export interface ComponentDefinition {
  at?: [number, number];
  anchor?: [number, number];
  use?: string;
  params?: Record<string, string>;
  pattern?: string;
  palette?: Record<string, string>;
  children?: Record<string, ComponentDefinition>;
}

export interface SpriteDefinition {
  meta: SpriteMeta;
  palette: Palette;
  templates?: Record<string, SpriteTemplate>;
  components: Record<string, ComponentDefinition>;
}
