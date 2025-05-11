import { gql, makeVar, useQuery, useReactiveVar } from '@apollo/client';
import { WorldBorderSide } from '@virtcon2/network-world-entities';
import { useAppSelector } from '../../../hooks';
import Window from '../../components/window/Window';
import { isWindowOpen, WindowType } from '../../lib/WindowSlice';

// TODO: Fetch price to expand this section - query or field resolver?
const EXPAND_PLOT_WINDOW_QUERY = gql`
  query ExpandPlotWindow($side: Int!, $x: Int!, $y: Int!) {
    worldBorder
  }
`;

export const expandPlotVar = makeVar<{ side: WorldBorderSide; x: number; y: number }>({ side: WorldBorderSide.LEFT, x: 0, y: 0 });

export default function ExpandPlotWindow() {
  const isOpen = useAppSelector((state) => isWindowOpen(state, WindowType.VIEW_EXPAND_PLOT_WINDOW));

  const { side, x, y } = useReactiveVar(expandPlotVar);

  const { data, error, loading } = useQuery(EXPAND_PLOT_WINDOW_QUERY, {
    skip: !isOpen,
    variables: {
      side,
      x,
      y,
    },
  });

  console.log(`ExpandPlotWindow isopen: ${isOpen}`);

  return (
    <Window
      loading={[loading]}
      errors={[error]}
      title="Expand plot"
      width={800}
      height={600}
      defaultPosition={{ x: window.innerWidth / 2 - 400, y: 40 }}
      windowType={WindowType.VIEW_EXPAND_PLOT_WINDOW}
    >
      <div className="flex flex-row h-full">
        <h2 className="text-2xl font-bold text-center mb-4">Expand Plot</h2>
      </div>
    </Window>
  );
}
