import { reaction } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Cesium from "../../../Models/Cesium";
import ViewState from "../../../ReactViewModels/ViewState";
import PositionRightOfWorkbench from "../../Workbench/PositionRightOfWorkbench";
import DropPedestrianToGround from "./DropPedestrianToGround";
import MiniMap, { getViewFromScene, MiniMapView } from "./MiniMap";
import MovementControls from "./MovementControls";

// The desired camera height measured from the surface in metres
export const PEDESTRIAN_HEIGHT = 1.7;

// Maximum up/down look angle in degrees
export const MAX_VERTICAL_LOOK_ANGLE = 40;

type PedestrianModeProps = {
  viewState: ViewState;
  cesium: Cesium;
};

const PedestrianMode: React.FC<PedestrianModeProps> = observer(props => {
  const { viewState, cesium } = props;
  const [isDropped, setIsDropped] = useState<boolean>(false);
  const [view, setView] = useState<MiniMapView | undefined>();

  const onDropCancelled = () => viewState.closeTool();
  const updateView = () => setView(getViewFromScene(cesium.scene));

  useEffect(function closeOnZoomTo() {
    const disposer = reaction(
      () => cesium.isMapZooming,
      isMapZooming => {
        if (isMapZooming) viewState.closeTool();
      }
    );
    return disposer;
  }, []);

  return (
    <>
      {!isDropped && (
        <DropPedestrianToGround
          cesium={cesium}
          afterDrop={() => setIsDropped(true)}
          onDropCancelled={onDropCancelled}
          pedestrianHeight={PEDESTRIAN_HEIGHT}
        />
      )}
      {isDropped && (
        <>
          <ControlsContainer viewState={viewState}>
            <MovementControls
              cesium={cesium}
              onMove={updateView}
              pedestrianHeight={PEDESTRIAN_HEIGHT}
              maxVerticalLookAngle={MAX_VERTICAL_LOOK_ANGLE}
            />
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
});

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
`;

export default PedestrianMode;
