import { gql, makeVar, useQuery, useReactiveVar } from '@apollo/client';
import { WorldBorderSide } from '@virtcon2/network-world-entities';
import { useTextureManager } from '../../../hooks/useGameTextures';
import { useAppSelector } from '../../../hooks';
import Window from '../../components/window/Window';
import { isWindowOpen, WindowType } from '../../lib/WindowSlice';
import { quantityFormatter } from '@shared';
import { useState } from 'react';

const EXPAND_PLOT_WINDOW_QUERY = gql`
  query ExpandPlotWindow($x: Int!, $y: Int!) {
    plotPrice(x: $x, y: $y) {
      count
      item {
        id
        name
        display_name
      }
    }
  }
`;

export const expandPlotVar = makeVar<{ side: WorldBorderSide; x: number; y: number }>({ side: WorldBorderSide.LEFT, x: 0, y: 0 });

export default function ExpandPlotWindow() {
  const textures = useTextureManager();
  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_EXPAND_PLOT_WINDOW));
  const [agreed, setAgreed] = useState(false);

  const { side, x, y } = useReactiveVar(expandPlotVar);
  const { x: realX, y: realY } = offsetToCorrectExpansionCoordinates(side, x, y);

  const { data, error, loading, refetch } = useQuery<{
    plotPrice: {
      count: number;
      item: {
        id: number;
        name: string;
        display_name: string;
      };
    }[];
  }>(EXPAND_PLOT_WINDOW_QUERY, {
    skip: !isOpen,
    variables: {
      side,
      x: realX,
      y: realY,
    },
  });

  return (
    <Window
      loading={[loading]}
      errors={[error]}
      title="Expand plot"
      width={500}
      height={600}
      retry={refetch}
      defaultPosition={{ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 }}
      windowType={WindowType.VIEW_EXPAND_PLOT_WINDOW}
    >
      <div className="flex flex-col h-full gap-2 py-4">
        <h2 className="text-2xl font-bold text-center">Expand Plot</h2>
        <div className="flex-1 p-4 justify-center">
          {!loading && !error && data?.plotPrice.length === 0 && <p>Wow, you're lucky. This plot is free!</p>}
          <div className="flex flex-col gap-2 max-w-md mx-auto">
            <p className="text-sm text-gray-700 mb-2">
              To expand your plot, you need to pay the following items. The cost is based on the number of plots you already own and
              potential value extraction from the expansion.
            </p>
            {data?.plotPrice.map((price) => (
              <div key={price.item.id} className="p-1 px-2 rounded bg-gray-800 flex flex-row items-center gap-2 justify-between">
                <div className="flex-1 items-center flex flex-row gap-2 justify-start">
                  <p>{price.item.display_name}</p>
                  <img
                    draggable="false"
                    unselectable="on"
                    src={textures?.getBase64(price.item.name + '_0')}
                    alt={price.item.display_name}
                    className="h-8 w-8 pixelart"
                  />
                </div>
                <span>{quantityFormatter.format(price.count)}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            Click on the border tile to expand your plot. You will need to pay the required amount of items.
          </p>
        </div>

        <div className="flex justify-center flex-col">
          <div>
            <label className="inline-flex items-center mb-2 gap-2">
              <input type="checkbox" onClick={() => setAgreed((prev) => !prev)} className="form-checkbox h-6 w-6 text-green-600" />
              <span className="ml-2 text-sm text-gray-200">
                I agree to the terms of land expansion, including resource payment and future development guidelines.
              </span>
            </label>
          </div>
          <button
            disabled={!agreed || loading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              // Logic to handle the expansion of the plot
              // This could be a mutation to update the world state
              console.log(`Expanding plot at (${realX}, ${realY}) on side ${WorldBorderSide[side]}`);
            }}
          >
            Sign expansion contract
          </button>
        </div>
      </div>
    </Window>
  );
}

const offsetToCorrectExpansionCoordinates = (side: WorldBorderSide, x: number, y: number) => {
  if (side === WorldBorderSide.LEFT || side === WorldBorderSide.RIGHT) {
    y -= 8;
  }
  if (side === WorldBorderSide.TOP || side === WorldBorderSide.BOTTOM) {
    x -= 8;
  }
  if (side === WorldBorderSide.LEFT) {
    x -= 16;
  }
  if (side === WorldBorderSide.RIGHT) {
    x += 16;
  }
  if (side === WorldBorderSide.TOP) {
    y -= 16;
  }
  if (side === WorldBorderSide.BOTTOM) {
    y += 16;
  }
  return { x, y };
};
