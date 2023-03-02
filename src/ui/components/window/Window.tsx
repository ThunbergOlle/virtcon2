import Draggable from "react-draggable";
import { WindowType } from "../../lib/WindowManager";
import WindowHeader from "../WindowHeader";
import "./Window.css";
import { Card } from "react-bootstrap";
export default function Window(props: {
  title: string;
  onFocus: (window: WindowType) => void;
  onClose: (window: WindowType) => void;
  isOpen: boolean;
  className: string;
  windowType: WindowType;
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  if (!props.isOpen) return null;
  return (
    <Draggable
      axis="both"
      handle=".handle"
      bounds={{ top: 0 }}
      defaultPosition={{ x: 40, y: 10 }}
      onMouseDown={() => props.onFocus(props.windowType)}
    >
      <Card
        className="window"
        style={{ width: props.width, height: props.height }}
      >
        <WindowHeader
          title={props.title}
          onClose={() => props.onClose(props.windowType)}
        ></WindowHeader>
        <div className="content">{props.children}</div>
      </Card>
    </Draggable>
  );
}
