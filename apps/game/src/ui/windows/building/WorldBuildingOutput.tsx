import React from 'react';
import { useMemo } from 'react';

export default function WorldBuildingOutput(props: {
  currentOutputPosition: { x: number; y: number };
  width: number;
  height: number;
  relativePosition: { x: number; y: number };
  outputBuildingId: number | null;
  onNewPositionSelected: (position: { x: number; y: number }) => void;
}) {
  const grid = useMemo(() => {
    const gridWidth = props.width + 2;
    const gridHeight = props.height + 2;
    const new_grid = [];
    const disabledCell = <div className="border-2  border-gray-400 w-8 h-8 bg-yellow-500 cursor-not-allowed text-center">B</div>;
    const emptyCell = <div className="w-8 h-8 cursor-not-allowed"></div>;
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (x + props.relativePosition.x - 1 === props.currentOutputPosition.x && y + props.relativePosition.y - 1 === props.currentOutputPosition.y) {
          new_grid.push(<div className={`border-2  border-gray-400 w-8 h-8 bg-${props.outputBuildingId ? 'green':'yellow'}-500 cursor-pointer text-center text-[10px]`}>OUT</div>);
        } else if (x === 0 || x === gridWidth - 1 || y === 0 || y === gridHeight - 1) {
          new_grid.push(
            <div
              onClick={() => props.onNewPositionSelected({ x: props.relativePosition.x + x - 1, y: props.relativePosition.y + y - 1 })}
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
  }, [props]);

  return (
    <div className="flex flex-row flex-wrap" style={{ width: 32 * (props.height + 2), height: 32 * (props.height + 2) }}>
      {grid.map((cell, index) => (
        <React.Fragment key={index}>{cell}</React.Fragment>
      ))}
    </div>
  );
}
