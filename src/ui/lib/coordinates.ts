export type Coordinates = {
  x: number;
  y: number;
};
const tileSize = 16;
export function toPhaserPos(
  coordinates: Coordinates
): Coordinates {
  return {
    x: coordinates.x * tileSize + tileSize / 2,
    y: coordinates.y * tileSize + tileSize / 2,
  };
}
export function fromPhaserPos(
  position: Coordinates
): Coordinates {
  return {
    x: Math.floor(position.x / tileSize),
    y: Math.floor(position.y / tileSize),
  };
}
