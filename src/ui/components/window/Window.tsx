import Draggable from "react-draggable";
import { WindowManagerFunctions, WindowType } from "../../lib/WindowManager";
import WindowHeader from "./WindowHeader";
import "./Window.css";
import { Card } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
export default function Window(props: {
  windowManager: WindowManagerFunctions;
  title: string;
  windowType: WindowType;
  defaultPosition?: { x?: number; y?: number };
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  const nodeRef = useRef(null);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(props.windowManager.isOpen(props.windowType));
  }, [props.windowManager.stack]);

  useEffect(() => {
    props.windowManager.registerWindow(props.windowType);
  }, []);
  if (!open) return null;
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
      onMouseDown={() => props.windowManager.selectWindow(props.windowType)}
    >
      <Card
        ref={nodeRef}
        className="window"
        style={{ width: props.width, height: props.height }}
      >
        <WindowHeader
          title={props.title}
          onClose={() => props.windowManager.closeWindow(props.windowType)}
        ></WindowHeader>
        <div className="content h-full">{props.children}</div>
      </Card>
    </Draggable>
  );
}
