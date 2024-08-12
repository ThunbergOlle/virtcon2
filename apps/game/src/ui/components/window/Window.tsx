import { useRef } from 'react';
import { Card } from 'react-bootstrap';
import Draggable from 'react-draggable';
import { useAppDispatch, useAppSelector } from '../../../hooks';
import { close, isWindowOpen, select, selectClass, WindowType } from '../../lib/WindowSlice';
import './Window.scss';
import WindowHeader from './WindowHeader';

export default function Window(props: {
  title: string;
  windowType: WindowType;
  defaultPosition?: { x?: number; y?: number };
  width: number;
  height: number;
  children: React.ReactNode;
  errors?: Array<Error | undefined>;
  fullWindowLoading?: boolean;
  loading?: Array<boolean>;
}) {
  const nodeRef = useRef(null);

  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => isWindowOpen(state, props.windowType));
  const windowClass = useAppSelector((state) => selectClass(state, props.windowType));

  if (!isOpen) return null;
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
      onMouseDown={(e) => {
        // e.preventDefault();
        e.stopPropagation();
        dispatch(select(props.windowType));
      }}
    >
      <Card ref={nodeRef} className={'window  ' + windowClass} style={{ width: props.width, height: props.height }}>
        <WindowHeader
          loading={props.loading?.every((l) => l)}
          title={props.title}
          onClose={() => {
            dispatch(close(props.windowType));
          }}
        />
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
        {!filteredErrors?.length && !props.fullWindowLoading && <div className="content h-full text-white">{props.children}</div>}
      </Card>
    </Draggable>
  );
}
