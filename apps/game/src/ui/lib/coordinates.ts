export type TileCoordinate = number;
export type Coordinates = {
  x: number;
  y: number;
};
export type TileCoordinates = {
  x: TileCoordinate;
  y: TileCoordinate;
};
export const tileSize = 16;
export function toPhaserPos(coordinates: TileCoordinates): Coordinates {
  return {
    x: coordinates.x * tileSize + tileSize / 2,
    y: coordinates.y * tileSize + tileSize / 2,
  };
}
export function fromPhaserPos(position: Coordinates): TileCoordinates {
  return {
    x: Math.floor(position.x / tileSize),
    y: Math.floor(position.y / tileSize),
  };
}
export function roundToTile(coordinates: Coordinates): TileCoordinates {
  return {
    x: Math.round(coordinates.x / tileSize) * tileSize + tileSize / 2,
    y: Math.round(coordinates.y / tileSize) * tileSize + tileSize / 2,
  };
}
