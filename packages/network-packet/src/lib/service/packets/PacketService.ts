export function parsePayload(payload: string): Array<string | number> {
  return payload.split('#');
}
export function extractWorldId(payload: string): string {
  return payload.split('_')[0];
}
