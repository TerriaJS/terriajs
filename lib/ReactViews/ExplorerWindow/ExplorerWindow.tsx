import { action } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import ViewState from "../../ReactViewModels/ViewState";
import ModalPopup from "./ModalPopup";
import Tabs from "./Tabs";

export const ExplorerWindowElementName = "AddData";

interface IProps {
  viewState: ViewState;
  terria: ViewState["terria"];
}

export default observer<React.FC<IProps>>(function ExplorerWindow(props) {
  const onClose = action(() => {
    props.viewState.closeCatalog();
    props.viewState.switchMobileView("nowViewing");
  });

  const onStartAnimatingIn = action(() => {
    props.viewState.explorerPanelAnimating = true;
  });

  const onDoneAnimatingIn = action(() => {
    props.viewState.explorerPanelAnimating = false;
  });

  const isVisible =
    !props.viewState.useSmallScreenInterface &&
    !props.viewState.hideMapUi &&
    props.viewState.explorerPanelIsVisible;

  return (
    <ModalPopup
      viewState={props.viewState}
      isVisible={isVisible}
      isTopElement={props.viewState.topElement === ExplorerWindowElementName}
      onClose={onClose}
      onStartAnimatingIn={onStartAnimatingIn}
      onDoneAnimatingIn={onDoneAnimatingIn}
    >
      <Tabs terria={props.terria} viewState={props.viewState} />
    </ModalPopup>
  );
});
