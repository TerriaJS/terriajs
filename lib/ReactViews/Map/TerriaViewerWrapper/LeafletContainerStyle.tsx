import { observer } from "mobx-react";
import { FC } from "react";
import { createGlobalStyle } from "styled-components";
import Terria from "../../../Models/Terria";
import ViewerMode from "../../../Models/ViewerMode";
import { useViewState } from "../../Context/ViewStateContext";

/**
 * Injects global styles for leaflet container based on map state.
 */
const LeafletContainerStyle: FC<object> = observer(() => {
  const terria = useViewState().terria;

  if (terria.mainViewer.viewerMode !== ViewerMode.Leaflet) {
    return null;
  }

  const containerBackgroundColor = getBaseMapBackgroundColor(terria);

  return containerBackgroundColor ? (
    <LeafletContainerGlobalStyle backgroundColor={containerBackgroundColor} />
  ) : null;
});

/**
 * Return background color of the active base map
 */
function getBaseMapBackgroundColor(terria: Terria): string | undefined {
  return terria.baseMapsModel.baseMapItems.find(
    (it) => it.item === terria.mainViewer.baseMap
  )?.backgroundColor;
}

/**
 * Defines global styles for leaflet map container
 */
const LeafletContainerGlobalStyle = createGlobalStyle<{
  backgroundColor?: string;
}>`
  .mapContainer {
    ${(props) =>
      props.backgroundColor
        ? `background-color: ${props.backgroundColor};`
        : ""}
  }
`;

export default LeafletContainerStyle;
