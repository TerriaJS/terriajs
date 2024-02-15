import { action } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import ViewState from "../../ReactViewModels/ViewState";
import { useViewState } from "../Context";

type PortalProps = {
  /**
   * id of the new portal.
   *
   * The id value is used as the id of the DOM element for the portal,
   * it must be a DOM unique value.
   */
  id: string;

  className?: string;
};

/**
 * Defines a portal with given id that can be attached by calling <PortalChild portalId={id} />
 */
export const Portal: React.FC<PortalProps> = ({ id, className }) => {
  const viewState = useViewState();
  useEffect(
    action(() => {
      viewState.portals.set(id, document.getElementById(id));
      return action(() => {
        viewState.portals.delete(id);
      });
    }),
    [id, className]
  );
  return <div id={id} className={className} />;
};

export type PortalChildProps = {
  viewState: ViewState;
  portalId: string;
  children: React.ReactNode;
};

/**
 * Attach children to the <Portal> identified by portalId
 */
export const PortalChild: React.FC<PortalChildProps> = observer(
  ({ viewState, portalId, children }) => {
    const container = viewState.portals.get(portalId);
    return container ? ReactDOM.createPortal(children, container) : null;
  }
);
