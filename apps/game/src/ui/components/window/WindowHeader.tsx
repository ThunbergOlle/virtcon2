import { useState } from "react";
import { Button, Card } from "react-bootstrap";
export default function WindowHeader(props: {
  title: string;
  onClose?: () => void;
  onRefresh?: () => void;
}) {
  const [hideContent, setHideContent] = useState(false);
  return (
    <Card.Header className="handle window-header">
      <div className="window-header-container">
        <p className="window-title">{props.title}</p>

          {props.onClose !== undefined && (
            <div className="close-button-container">
            <Button
              size="sm"
              className="close-button"
              onClick={() => {
                if (props.onClose !== undefined) {
                  props.onClose();
                  setHideContent(!hideContent);
                }
              }}
            >
              X
            </Button>
              </div>
          )}
        </div>

    </Card.Header>
  );
}
