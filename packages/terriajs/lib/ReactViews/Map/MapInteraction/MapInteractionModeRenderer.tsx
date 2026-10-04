import { observer } from "mobx-react";
import { FC, useEffect } from "react";
import { useViewState } from "../../Context";
import {
  getMapInteractionModePanel,
  registerMapInteractionModePanel
} from "./registerMapInteractionModePanel";
import DefaultMapInteractionModePanel from "./DefaultMapInteractionModePanel";

registerMapInteractionModePanel("default", DefaultMapInteractionModePanel);

const MapInteractionModeRenderer: FC = observer(() => {
  const viewState = useViewState();
  const terria = viewState.terria;
  const mapInteractionMode = terria.mapInteractionModeStack.at(-1);

  useEffect(() => {
    mapInteractionMode?.onEnable?.(viewState);
  }, [mapInteractionMode, viewState]);

  if (!mapInteractionMode) {
    return null;
  }

  const Renderer = mapInteractionMode.panel
    ? getMapInteractionModePanel(mapInteractionMode.panel)
    : undefined;
  return Renderer ? <Renderer mapInteractionMode={mapInteractionMode} /> : null;
});

export default MapInteractionModeRenderer;
