import { createContext } from 'react';
import { WindowManager, WindowStack, WindowType, windowManager } from '../../lib/WindowManager';

export const WindowStackContext = createContext<WindowManager>({
  setWindowStack: function (value: { type: 'open' | 'close' | 'select' | 'register' | 'toggle'; windowType: WindowType; }): void {
    throw new Error('Function not implemented.');
  },
  windowStack: []
});

export const windowStackReducer = (state: WindowStack[], action: { type: 'open' | 'close' | 'select' | 'register' | 'toggle'; windowType: WindowType }) => {
  switch (action.type) {
    case 'open':
      return windowManager.selectWindow(action.windowType, state);
    case 'close':
      return windowManager.closeWindow(action.windowType, state);
    case 'select':
      return windowManager.selectWindow(action.windowType, state);
    case 'register':
      return windowManager.registerWindow(action.windowType, state);
    case 'toggle':
      if (state.find((i) => i.type === action.windowType)?.open) return windowManager.closeWindow(action.windowType, state);
      else return windowManager.selectWindow(action.windowType, state);
    default:
      throw new Error('Invalid action type');
  }
};
