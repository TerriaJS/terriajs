import { observer } from "mobx-react";
import { FC } from "react";
import { createGlobalStyle } from "styled-components";
import { useViewState } from "../../Context/ViewStateContext";

/**
 * Injects global styles for leaflet container based on map state.
 */
const LeafletContainerStyle: FC<object> = observer(() => {
  const terria = useViewState().terria;

  // Derive background color from active base map
  const backgroundColor = terria.baseMapsModel.baseMapItems.find(
    (b) => b.item === terria.mainViewer.baseMap
  )?.backgroundColor;

  return <LeafletContainerGlobalStyle backgroundColor={backgroundColor} />;
});

/**
 * Defines global styles for leaflet map container
 */
const LeafletContainerGlobalStyle = createGlobalStyle<{
  backgroundColor?: string;
}>`
  .leaflet-container {
    background-color: ${(props) => props.backgroundColor ?? "#ddd"}
  }
`;

export default LeafletContainerStyle;
