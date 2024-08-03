import { gql, useFragment } from '@apollo/client';
import React from 'react';
import { useMemo } from 'react';

export const WORLD_BUILDING_OUTPUT_FRAGMENT = gql`
  fragment WorldBuildingOutputFragment on WorldBuilding {
    id
    x
    y
    output_pos_x
    output_pos_y
    building {
      id
      name
      width
      height
    }
    output_world_building {
      id
    }
  }
`;
export default function WorldBuildingOutput(props: { worldBuildingId?: number; onNewPositionSelected: (position: { x: number; y: number }) => void }) {
  const { data } = useFragment({
    fragment: WORLD_BUILDING_OUTPUT_FRAGMENT,
    fragmentName: 'WorldBuildingOutputFragment',
    from: {
      __typename: 'WorldBuilding',
      id: props.worldBuildingId,
    },
  });

  const grid = useMemo(() => {
    if (!data?.id) return [];
    const gridWidth = data.building.width + 2;
    const gridHeight = data.building.height + 2;
    const new_grid = [];
    const disabledCell = <div className="border-2  border-gray-400 w-8 h-8 bg-yellow-500 cursor-not-allowed text-center">B</div>;
    const emptyCell = <div className="w-8 h-8 cursor-not-allowed"></div>;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (x + data.x - 1 === data.output_pos_x && y + data.y - 1 === data.output_pos_y) {
          new_grid.push(
            <div
              className={`border-2  border-gray-400 w-8 h-8 bg-${data.output_world_building ? 'green' : 'yellow'}-500 cursor-pointer text-center text-[10px]`}
            >
              OUT
            </div>,
          );
        } else if (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1) {
          new_grid.push(
            <div
              onClick={() => props.onNewPositionSelected({ x: data.x + x - 1, y: data.y + y - 1 })}
              className="border-2  border-gray-400 w-8 h-8 cursor-pointer"
            ></div>,
          );
        } else {
          new_grid.push(disabledCell);
        }
      }
    }
    // remove corners from grid
    new_grid[0] = emptyCell;
    new_grid[gridWidth - 1] = emptyCell;
    new_grid[gridWidth * (gridHeight - 1)] = emptyCell;
    new_grid[gridWidth * gridHeight - 1] = emptyCell;

    return new_grid;
  }, [data.building, data.output_pos_x, data.output_pos_y, data.output_world_building, data.x, data.y, props]);

  return (
    <div className="flex flex-row flex-wrap" style={{ width: 32 * (data?.building?.width + 2), height: 32 * (data?.building?.height + 2) }}>
      {grid.map((cell, index) => (
        <React.Fragment key={index}>{cell}</React.Fragment>
      ))}
    </div>
  );
}
