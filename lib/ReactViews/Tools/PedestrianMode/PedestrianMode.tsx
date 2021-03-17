import { observer } from "mobx-react";
import React, { useState } from "react";
import styled from "styled-components";
import Cesium from "../../../Models/Cesium";
import ViewState from "../../../ReactViewModels/ViewState";
import PositionRightOfWorkbench from "../../Workbench/PositionRightOfWorkbench";
import DropPedestrianToGround from "./DropPedestrianToGround";
import MiniMap, { getViewFromScene, MiniMapView } from "./MiniMap";
import MovementControls from "./MovementControls";

const PEDESTRIAN_HEIGHT_IN_METRES = 1.5;

type PedestrianModeProps = {
  viewState: ViewState;
};
export const PEDESTRIAN_MODE_ID = "pedestrian-mode";

const PedestrianMode: React.FC<PedestrianModeProps> = observer(
  (props: PedestrianModeProps) => {
    const { viewState } = props;

    const cesium = viewState.terria.currentViewer;
    const [isDropped, setIsDropped] = useState<boolean>(false);
    const [view, setView] = useState<MiniMapView | undefined>();

    const onDropCancelled = () => viewState.closeTool();

    //if viewer is not cesium close tool.
    if (!(cesium instanceof Cesium)) {
      viewState.closeTool();
      return null;
    }
    const updateView = () => setView(getViewFromScene(cesium.scene));

    return (
      <>
        {!isDropped && (
          <DropPedestrianToGround
            cesium={cesium}
            afterDrop={() => setIsDropped(true)}
            onDropCancelled={onDropCancelled}
            minHeightFromGround={PEDESTRIAN_HEIGHT_IN_METRES}
          />
        )}
        {isDropped && (
          <>
            <ControlsContainer viewState={viewState}>
              <MovementControls cesium={cesium} onMove={updateView} />
            </ControlsContainer>
            <MiniMapContainer viewState={viewState}>
              <MiniMap
                terria={viewState.terria}
                baseMap={viewState.terria.mainViewer.baseMap!}
                view={view || getViewFromScene(cesium.scene)}
              />
            </MiniMapContainer>
          </>
        )}
      </>
    );
  }
);

const ControlsContainer = styled(PositionRightOfWorkbench)`
  width: 140px;
  top: unset;
  left: 0px;
  bottom: 300px;
`;

const MiniMapContainer = styled(PositionRightOfWorkbench)`
  width: 140px;
  height: 180px;
  top: unset;
  left: 0px;
  bottom: 100px;
  border: 1px solid white;
`;

export default PedestrianMode;
