import { ComponentDefinition, SpriteDefinition, SpriteTemplate, PartDefinition } from '../types/sprite-definition';

export interface ResolvedComponent {
  at: [number, number];
  anchor: [number, number];
  pattern?: string;
  palette?: Record<string, string>;
  children: ResolvedComponent[];
}

export function resolveComponents(def: SpriteDefinition): ResolvedComponent[] {
  const resolved: ResolvedComponent[] = [];

  for (const [, component] of Object.entries(def.components)) {
    resolved.push(resolveComponent(component, def));
  }

  return resolved;
}

function resolveComponent(component: ComponentDefinition, def: SpriteDefinition): ResolvedComponent {
  const at: [number, number] = component.at ?? [0, 0];
  const anchor: [number, number] = component.anchor ?? [0, 0];

  // If using a template, expand it
  if (component.use && def.templates?.[component.use]) {
    return resolveTemplateUse(component, def.templates[component.use], def, at, anchor);
  }

  // Resolve children recursively
  const children: ResolvedComponent[] = [];
  if (component.children) {
    for (const [, child] of Object.entries(component.children)) {
      children.push(resolveComponent(child, def));
    }
  }

  return {
    at,
    anchor,
    pattern: component.pattern,
    palette: component.palette,
    children,
  };
}

function resolveTemplateUse(
  component: ComponentDefinition,
  template: SpriteTemplate,
  def: SpriteDefinition,
  at: [number, number],
  anchor: [number, number]
): ResolvedComponent {
  const params = component.params ?? {};

  // Resolve template parts into children
  const children: ResolvedComponent[] = [];

  if (template.parts) {
    for (const part of template.parts) {
      children.push(resolveTemplatePart(part, params, def));
    }
  }

  return {
    at,
    anchor,
    palette: component.palette,
    children,
  };
}

function resolveTemplatePart(
  part: PartDefinition,
  params: Record<string, string>,
  def: SpriteDefinition
): ResolvedComponent {
  return {
    at: part.at ?? [0, 0],
    anchor: part.anchor ?? [0, 0],
    pattern: substituteParams(part.pattern, params),
    palette: substituteParamsInPalette(part.palette, params),
    children: [],
  };
}

function substituteParams(value: string | undefined, params: Record<string, string>): string | undefined {
  if (!value) return value;

  let result = value;
  for (const [key, replacement] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\$${key}`, 'g'), replacement);
  }
  return result;
}

function substituteParamsInPalette(
  palette: Record<string, string> | undefined,
  params: Record<string, string>
): Record<string, string> | undefined {
  if (!palette) return palette;

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(palette)) {
    result[key] = substituteParams(value, params) ?? value;
  }
  return result;
}
