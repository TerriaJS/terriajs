import { action } from "mobx";
import React, { useEffect } from "react";
import useViewState from "../Hooks/useViewState";

type PropsType = { id: string; className?: string };

const PortalContainer: React.FC<PropsType> = ({ id, className }) => {
  const viewState = useViewState();
  useEffect(
    action(() => {
      viewState.portals.set(id, document.getElementById(id));
    })
  );
  return <div id={id} className={className} />;
};

export default PortalContainer;
