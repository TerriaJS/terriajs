import { observable, runInAction } from "mobx";
import { ComponentType } from "react";
import MapInteractionMode from "../../../Models/MapInteractionMode";

export interface MapInteractionPanelProps {
  mapInteractionMode: MapInteractionMode;
}

const mapInteractionModePanels: Record<
  string,
  ComponentType<MapInteractionPanelProps>
> = observable({}, undefined, { deep: false });

/**
 * Register a map interaction mode panel component
 *
 * @param id ID of the panel component
 * @param renderer The renderer component
 */
export function registerMapInteractionModePanel(
  id: string,
  renderer: ComponentType<MapInteractionPanelProps>
) {
  runInAction(() => {
    mapInteractionModePanels[id] = renderer;
  });
}

/**
 * Get a registered map interaction mode panel by ID
 */
export function getMapInteractionModePanel(
  id: string
): ComponentType<MapInteractionPanelProps> | undefined {
  return mapInteractionModePanels[id];
}
