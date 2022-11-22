import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { useViewState } from "../StandardUserInterface/ViewStateContext";
import ModalPopup from "./ModalPopup";
import Box from "../../Styled/Box";
import { Tabs } from "./Tabs/Tabs";

export const ExplorerWindowElementName = "AddData";

export default observer<React.FC>(function ExplorerWindow() {
  const viewState = useViewState();

  const onClose = action(() => {
    viewState.closeCatalog();
    viewState.switchMobileView("nowViewing");
  });

  const onStartAnimatingIn = action(() => {
    viewState.explorerPanelAnimating = true;
  });

  const onDoneAnimatingIn = action(() => {
    viewState.explorerPanelAnimating = false;
  });

  const isVisible =
    !viewState.useSmallScreenInterface &&
    !viewState.hideMapUi &&
    viewState.explorerPanelIsVisible;

  return (
    <ModalPopup
      viewState={viewState}
      isVisible={isVisible}
      isTopElement={true}
      onClose={onClose}
      onStartAnimatingIn={onStartAnimatingIn}
      onDoneAnimatingIn={onDoneAnimatingIn}
    >
      <Box
        id="explorer-panel"
        aria-labelledby="modalTitle"
        aria-describedby="modalDescription"
        role="dialog"
        styledMaxWidth="1200px"
        flex="1"
        css={{ zIndex: 99999 }}
      >
        <Tabs viewState={viewState} onClose={onClose} />
      </Box>
    </ModalPopup>
  );
});
