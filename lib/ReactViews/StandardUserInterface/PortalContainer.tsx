import { action } from "mobx";
import React, { useEffect } from "react";
import ViewState from "../../ReactViewModels/ViewState";

type PropsType = { viewState: ViewState; id: string };

const PortalContainer: React.FC<PropsType> = ({ viewState, id }) => {
  useEffect(
    action(() => {
      viewState.portals.set(id, document.getElementById(id));
    })
  );
  return <div id={id} />;
};

export default PortalContainer;
