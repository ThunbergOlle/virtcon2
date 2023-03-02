import { useState } from "react";
import { Button, Card } from "react-bootstrap";
export default function WindowHeader(props: {
  title: string;
  onChange?: Function;
  onClose?: () => void;
  onRefresh?: () => void;
}) {
  const [hideContent, setHideContent] = useState(false);
  return (
    <Card.Header className="handle">
      <div style={{display:'flex', justifyContent: 'space-between', paddingInline: 20}}>
        <p style={{ flex: 1 }}>{props.title}</p>
        
          {props.onClose !== undefined && (
            <div style={{flex: 1, display: 'flex', flexDirection:'row', alignItems:'center', justifyContent: 'flex-end'}}>
            <Button
              size="sm"
              style={{
                flex: 1,
                justifySelf: "flex-end",
                maxWidth: 40,
                maxHeight: 40,
                marginRight: 10,
                textAlign: "center",
                fontSize: 12,
                padding: 0,
                
                backgroundColor: "darkred",
                borderColor: "darkred",
              }}
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
