import { defineQuery, World } from '@virtcon2/bytenetc';
import { GrowableTile, Position, Building, Resource, Player, Tile } from '@virtcon2/network-world-entities';

interface EntityPosition {
  x: number;
  y: number;
  type: 'tile' | 'building' | 'resource' | 'player';
  entity: number;
}

interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const SYMBOLS = {
  tile: '.',
  building: '█',
  resource: '♦',
  player: '@',
  empty: ' ',
  overlap: '?',
} as const;

const TILE_SIZE = 16; // Based on your codebase

// Convert world coordinates to tile coordinates
const worldToTile = (worldPos: number): number => {
  return Math.floor(worldPos / TILE_SIZE);
};

// Get all entity positions
const getEntityPositions = (world: World): EntityPosition[] => {
  const tileQuery = defineQuery(GrowableTile, Position);
  const buildingQuery = defineQuery(Building, Position);
  const resourceQuery = defineQuery(Resource, Position);
  const playerQuery = defineQuery(Player, Position);

  const positions: EntityPosition[] = [];

  // Get growable tiles
  const tiles = tileQuery(world);
  for (const entity of tiles) {
    positions.push({
      x: worldToTile(Position(world).x[entity]),
      y: worldToTile(Position(world).y[entity]),
      type: 'tile',
      entity,
    });
  }

  // Get buildings
  const buildings = buildingQuery(world);
  for (const entity of buildings) {
    positions.push({
      x: worldToTile(Position(world).x[entity]),
      y: worldToTile(Position(world).y[entity]),
      type: 'building',
      entity,
    });
  }

  // Get resources
  const resources = resourceQuery(world);
  for (const entity of resources) {
    positions.push({
      x: worldToTile(Position(world).x[entity]),
      y: worldToTile(Position(world).y[entity]),
      type: 'resource',
      entity,
    });
  }

  // Get players
  const players = playerQuery(world);
  for (const entity of players) {
    positions.push({
      x: worldToTile(Position(world).x[entity]),
      y: worldToTile(Position(world).y[entity]),
      type: 'player',
      entity,
    });
  }

  return positions;
};

// Calculate map bounds
const getMapBounds = (positions: EntityPosition[]): MapBounds => {
  if (positions.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  const xs = positions.map((p) => p.x);
  const ys = positions.map((p) => p.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
};

// Create the debug map
export const debugWorld = (
  world: World,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    showCoordinates?: boolean;
    showStats?: boolean;
  } = {},
): void => {
  const { maxWidth = 80, maxHeight = 40, showCoordinates = true, showStats = true } = options;

  const positions = getEntityPositions(world);
  const bounds = getMapBounds(positions);

  if (positions.length === 0) {
    console.log('🗺️  World Debug Map: No entities found');
    return;
  }

  const width = Math.min(bounds.maxX - bounds.minX + 1, maxWidth);
  const height = Math.min(bounds.maxY - bounds.minY + 1, maxHeight);

  // Create the grid
  const grid: string[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(SYMBOLS.empty));

  // Track entity counts at each position for overlap detection
  const entityCounts: Map<string, EntityPosition[]> = new Map();

  // Place entities on the grid
  for (const pos of positions) {
    const gridX = pos.x - bounds.minX;
    const gridY = pos.y - bounds.minY;

    // Skip if outside our display bounds
    if (gridX < 0 || gridX >= width || gridY < 0 || gridY >= height) continue;

    const key = `${gridX},${gridY}`;
    const existing = entityCounts.get(key) || [];
    existing.push(pos);
    entityCounts.set(key, existing);

    // Determine symbol based on priority (player > building > resource > tile)
    if (existing.length > 1) {
      grid[gridY][gridX] = SYMBOLS.overlap;
    } else {
      const entityTypes = existing.map((e) => e.type);
      if (entityTypes.includes('player')) {
        grid[gridY][gridX] = SYMBOLS.player;
      } else if (entityTypes.includes('building')) {
        grid[gridY][gridX] = SYMBOLS.building;
      } else if (entityTypes.includes('resource')) {
        grid[gridY][gridX] = SYMBOLS.resource;
      } else {
        grid[gridY][gridX] = SYMBOLS.tile;
      }
    }
  }

  // Print the map
  console.log('\n🗺️  World Debug Map\n');

  if (showStats) {
    const stats = {
      tiles: positions.filter((p) => p.type === 'tile').length,
      buildings: positions.filter((p) => p.type === 'building').length,
      resources: positions.filter((p) => p.type === 'resource').length,
      players: positions.filter((p) => p.type === 'player').length,
    };

    console.log(`📊 Entity Stats:`);
    console.log(`   Tiles: ${stats.tiles} ${SYMBOLS.tile}`);
    console.log(`   Buildings: ${stats.buildings} ${SYMBOLS.building}`);
    console.log(`   Resources: ${stats.resources} ${SYMBOLS.resource}`);
    console.log(`   Players: ${stats.players} ${SYMBOLS.player}`);
    console.log(`   Overlaps: ${Array.from(entityCounts.values()).filter((arr) => arr.length > 1).length} ${SYMBOLS.overlap}`);
    console.log();
  }

  if (showCoordinates) {
    console.log(`📍 Bounds: (${bounds.minX}, ${bounds.minY}) to (${bounds.maxX}, ${bounds.maxY})`);
    console.log(`📏 Display Size: ${width} x ${height} tiles\n`);
  }

  // Print column numbers (X coordinates)
  if (showCoordinates && width <= 100) {
    let topNumbers = '   ';
    let bottomNumbers = '   ';

    for (let x = 0; x < width; x++) {
      const worldX = x + bounds.minX;
      const tens = Math.floor(Math.abs(worldX) / 10);
      const ones = Math.abs(worldX) % 10;

      topNumbers += tens > 0 ? tens.toString() : ' ';
      bottomNumbers += ones.toString();
    }

    console.log(topNumbers);
    console.log(bottomNumbers);
  }

  // Print the grid with row numbers (Y coordinates)
  for (let y = 0; y < height; y++) {
    const worldY = y + bounds.minY;
    const rowPrefix = showCoordinates ? `${worldY.toString().padStart(2, ' ')} ` : '';
    console.log(rowPrefix + grid[y].join(''));
  }

  console.log('\nLegend:');
  console.log(`${SYMBOLS.tile} = Growable Tiles`);
  console.log(`${SYMBOLS.building} = Buildings`);
  console.log(`${SYMBOLS.resource} = Resources`);
  console.log(`${SYMBOLS.player} = Players`);
  console.log(`${SYMBOLS.overlap} = Multiple Entities`);
  console.log(`${SYMBOLS.empty} = Empty Space`);

  // Show overlap details if any
  const overlaps = Array.from(entityCounts.entries()).filter(([_, entities]) => entities.length > 1);
  if (overlaps.length > 0) {
    console.log('\n⚠️  Overlapping Entities:');
    overlaps.forEach(([pos, entities]) => {
      const [gridX, gridY] = pos.split(',').map(Number);
      const worldX = gridX + bounds.minX;
      const worldY = gridY + bounds.minY;
      const entityList = entities.map((e) => `${e.type}(${e.entity})`).join(', ');
      console.log(`   (${worldX}, ${worldY}): ${entityList}`);
    });
  }

  console.log();
};

// Additional utility for focused debugging around a specific position
export const debugWorldAroundPosition = (world: World, centerX: number, centerY: number, radius = 10): void => {
  console.log(`\n🎯 Debugging world around position (${centerX}, ${centerY}) with radius ${radius}\n`);

  const positions = getEntityPositions(world);
  const centerTileX = worldToTile(centerX);
  const centerTileY = worldToTile(centerY);

  // Filter positions within radius
  const nearbyPositions = positions.filter((pos) => {
    const dx = pos.x - centerTileX;
    const dy = pos.y - centerTileY;
    return Math.abs(dx) <= radius && Math.abs(dy) <= radius;
  });

  if (nearbyPositions.length === 0) {
    console.log('No entities found in the specified area.');
    return;
  }

  // Create a focused bounds
  const focusedBounds = {
    minX: centerTileX - radius,
    maxX: centerTileX + radius,
    minY: centerTileY - radius,
    maxY: centerTileY + radius,
  };

  const width = focusedBounds.maxX - focusedBounds.minX + 1;
  const height = focusedBounds.maxY - focusedBounds.minY + 1;

  const grid: string[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(SYMBOLS.empty));

  // Mark center position
  const centerGridX = centerTileX - focusedBounds.minX;
  const centerGridY = centerTileY - focusedBounds.minY;
  grid[centerGridY][centerGridX] = '+';

  // Place entities
  for (const pos of nearbyPositions) {
    const gridX = pos.x - focusedBounds.minX;
    const gridY = pos.y - focusedBounds.minY;

    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
      if (grid[gridY][gridX] === '+') {
        grid[gridY][gridX] = '⊕'; // Center with entity
      } else if (grid[gridY][gridX] !== SYMBOLS.empty) {
        grid[gridY][gridX] = SYMBOLS.overlap;
      } else {
        grid[gridY][gridX] = SYMBOLS[pos.type];
      }
    }
  }

  // Print the focused grid
  for (let y = 0; y < height; y++) {
    const worldY = y + focusedBounds.minY;
    console.log(`${worldY.toString().padStart(3, ' ')} ${grid[y].join('')}`);
  }

  console.log('\nNearby Entities:');
  nearbyPositions.forEach((pos) => {
    const distance = Math.sqrt(Math.pow(pos.x - centerTileX, 2) + Math.pow(pos.y - centerTileY, 2)).toFixed(1);
    console.log(`  ${pos.type}(${pos.entity}) at (${pos.x}, ${pos.y}) - distance: ${distance}`);
  });
};
