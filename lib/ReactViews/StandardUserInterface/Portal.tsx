import { observer } from "mobx-react";
import React from "react";
import ReactDOM from "react-dom";
import useViewState from "../Hooks/useViewState";

export type PropsType = {
  id: string;
};

const Portal: React.FC<PropsType> = observer(({ id, children }) => {
  const viewState = useViewState();
  const container = viewState.portals.get(id);
  return container ? ReactDOM.createPortal(<>{children}</>, container) : null;
});

export default Portal;
