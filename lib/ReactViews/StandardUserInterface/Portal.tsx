import { observer } from "mobx-react";
import React from "react";
import ReactDOM from "react-dom";
import ViewState from "../../ReactViewModels/ViewState";

export type PropsType = {
  viewState: ViewState;
  id: string;
};

const Portal: React.FC<PropsType> = observer(({ viewState, id, children }) => {
  const container = viewState.portals.get(id);
  return container ? ReactDOM.createPortal(<>{children}</>, container) : null;
});

export default Portal;
