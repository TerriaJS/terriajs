import { observer } from "mobx-react";
import { FC } from "react";
import styled from "styled-components";
import { StyledButton } from "../../../Styled/Button";
import parseCustomHtmlToReact from "../../Custom/parseCustomHtmlToReact";
import { MapInteractionPanelProps } from "./registerMapInteractionModePanel";

/**
 * Displays a small floating panel at the top-center of the map
 */
const DefaultMapInteractionModePanel: FC<MapInteractionPanelProps> = observer(
  ({ mapInteractionMode }) => {
    const isActive = !mapInteractionMode.invisible;

    const message = parseCustomHtmlToReact(mapInteractionMode.message());
    const messageAsNode = mapInteractionMode.messageAsNode();

    return (
      <Panel isActive={isActive} aria-hidden={!isActive}>
        {(message || messageAsNode) && (
          <Message>
            {message}
            {messageAsNode}
          </Message>
        )}
        {mapInteractionMode.customUi?.()}
        {mapInteractionMode.onCancel && (
          <Button primary onClick={mapInteractionMode.onCancel}>
            {mapInteractionMode.buttonText}
          </Button>
        )}
      </Panel>
    );
  }
);

const Panel = styled.div<{ isActive: boolean }>`
  display: ${(p) => (p.isActive ? "block" : "none")};
  position: fixed;

  transform: translateX(-50%);
  left: 50%;
  background: #fff;
  width: 200px;
  top: 50px;
  z-index: 999;
  color: #000;
  padding: ${(p) => p.theme.padding};

  &:empty {
    padding: 0;
  }
`;

const Message = styled.div`
  margin-bottom: ${(p) => p.theme.padding};
`;

const Button = styled(StyledButton)`
  width: 100%;
  border-radius: 0px;
`;

export default DefaultMapInteractionModePanel;
