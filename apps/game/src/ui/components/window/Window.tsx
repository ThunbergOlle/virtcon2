import { useContext, useEffect, useRef } from 'react';
import { Card } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { WindowStackContext } from '../../context/window/WindowContext';
import { WindowType, windowManager } from '../../lib/WindowManager';
import './Window.scss';
import WindowHeader from './WindowHeader';
import { useForceUpdate } from '../../hooks/useForceUpdate';
export default function Window(props: {
  title: string;
  windowType: WindowType;
  defaultPosition?: { x?: number; y?: number };
  width: number;
  height: number;
  children: React.ReactNode;
  errors?: Array<Error | undefined>;
  loading?: Array<boolean>;
}) {
  const forceUpdate = useForceUpdate();
  const windowManagerContext = useContext(WindowStackContext);
  const nodeRef = useRef(null);

  useEffect(() => {
    windowManagerContext.setWindowStack({ type: 'register', windowType: props.windowType });
  }, [props.windowType]);
  if (!windowManager.isOpen(props.windowType, windowManagerContext.windowStack)) return null;
  const filteredErrors = props.errors?.filter((e) => e !== undefined) || ([] as Error[]);
  return (
    <Draggable
      axis="both"
      handle=".handle"
      nodeRef={nodeRef}
      bounds={{ top: 0 }}
      defaultPosition={{
        x: props.defaultPosition?.x ?? 40,
        y: props.defaultPosition?.y ?? 40,
      }}
      onMouseDown={() => windowManagerContext.setWindowStack({ type: 'select', windowType: props.windowType })}
    >
      <Card ref={nodeRef} className={'window  ' + windowManager.getClass(props.windowType, windowManagerContext.windowStack)} style={{ width: props.width, height: props.height }}>
        <WindowHeader loading={props.loading?.every((l) => l)} title={props.title} onClose={() => {windowManagerContext.setWindowStack({ type: 'close', windowType: props.windowType }); forceUpdate()}} />
        {filteredErrors.length > 0 && (
          <div className=" bg-red-900 h-full text-center flex flex-col items-center" role="alert">
            <h3 className="flex-1 pt-20 text-2xl">There were errors loading this window.</h3>
            <div className="flex-[4]">
              {filteredErrors.map((error) => (
                <p className="flex-1">{error?.message}</p>
              ))}
            </div>
          </div>
        )}
        {!filteredErrors?.length && <div className="content h-full text-white">{props.children}</div>}
      </Card>
    </Draggable>
  );
}
