import React from "react";
import styled from "styled-components";
import ViewState from "../../ReactViewModels/ViewState";
import { WorkflowPanelPortalId } from "../Workflow/WorkflowPanel";
import PortalContainer from "./PortalContainer";
import { withViewState } from "./ViewStateContext";

type PropsType = {
  viewState: ViewState;
  show: boolean;
};

const WorkflowPanelContainer: React.FC<PropsType> = ({ viewState, show }) => {
  return (
    <Container
      show={show}
      onTransitionEnd={() => viewState.triggerResizeEvent()}
    >
      <PortalContainer
        viewState={viewState}
        id={WorkflowPanelPortalId}
      ></PortalContainer>
    </Container>
  );
};

const Container = styled.div<{ show: boolean }>`
  height: 100vh;
  width: ${(p) => p.theme.workflowPanelWidth}px;
  max-width: ${(p) => p.theme.workflowPanelWidth}px;

  transition: all 0.25s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

  visibility: ${(p) => (p.show ? "visible" : "hidden")};
  margin-left: ${(p) => (p.show ? "0px" : `-${p.theme.workflowPanelWidth}px`)};
  opacity: ${(p) => (p.show ? 1 : 0)};
`;

export default withViewState(WorkflowPanelContainer);
