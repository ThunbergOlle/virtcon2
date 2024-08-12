import { useAppDispatch, useAppSelector } from '../../../hooks';
import { select } from './HotbarSlice';
import { useHotkey } from './useHotkey';

export const Hotbar = () => {
  const dispatch = useAppDispatch();
  const currentTool = useAppSelector((state) => state.hotbar.tool);

  useHotkey('1', () => dispatch(select('none')));
  useHotkey('2', () => dispatch(select('axe')));

  return (
    <div className="absolute h-16  z-[2] bottom-4 w-full flex">
      <div className="m-auto  bg-gray-800 h-full rounded-lg flex flex-row items-center">
        <div onClick={() => dispatch(select('none'))}>
          <img
            src="/assets/sprites/misc/no_tool.png"
            alt="no tool"
            className={`pixelart h-10 w-10 mx-3 cursor-pointer ${currentTool === 'none' && 'border-green-600 border-b-4'}`}
            draggable="false"
            unselectable="on"
          />
        </div>
        <div onClick={() => dispatch(select('axe'))}>
          <img
            src="/assets/sprites/misc/tool_axe.png"
            alt="axe"
            className={`pixelart h-10 w-10 mx-3 cursor-pointer ${currentTool === 'axe' && 'border-green-600 border-b-4'}`}
            draggable="false"
            unselectable="on"
          />
        </div>
      </div>
    </div>
  );
};
