// First: the cascade layers' order, then the design system's base styles
import "../layerOrder";
import "./UserInterface.css";

import { clsx } from "clsx";
import type { ReactElement } from "react";
import type Terria from "../../Models/Terria";
import type ViewState from "../../ReactViewModels/ViewState";
import { ViewStateProvider } from "../../ReactViewModels/ViewStateContext";
import { MapView } from "../MapView/MapView";

type UserInterfaceProps = {
  terria: Terria;
  viewState: ViewState;
  className?: string;
};

/**
 * The new user interface, built on the Terria design system: the map, with the
 * side panel and bottom dock beside it. A map turns it on with the
 * `experimentalNewUi` config parameter
 */
const UserInterface = ({
  terria,
  viewState,
  className
}: UserInterfaceProps): ReactElement => (
  <ViewStateProvider viewState={viewState}>
    <div className={clsx("tjs-user-interface", className)}>
      <aside className="tjs-user-interface__side-panel" />
      <main className="tjs-user-interface__map">
        <MapView viewer={terria.mainViewer} />
      </main>
      <div className="tjs-user-interface__bottom-dock" />
    </div>
  </ViewStateProvider>
);

export { UserInterface };
export type { UserInterfaceProps };
