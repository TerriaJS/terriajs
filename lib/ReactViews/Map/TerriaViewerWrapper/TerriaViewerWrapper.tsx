import { autorun } from "mobx";
import { FC, RefObject, useEffect, useRef } from "react";
import styled from "styled-components";
import ViewerMode from "../../../Models/ViewerMode";
import { useViewState } from "../../Context";
import { Splitter } from "./Splitter/Splitter";

export const TerriaViewerWrapper: FC = () => {
  const viewState = useViewState();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewState.terria.mainViewer.attached) {
      viewState.terria.mainViewer.detach();
    }
    if (containerRef.current) {
      viewState.terria.mainViewer.attach(containerRef.current);
    }

    return () => {
      viewState.terria.mainViewer.detach();
    };
  }, [viewState]);

  // Use an effect hook to change map container background so that we don't
  // re-render the whole component when the map container background changes.
  useMapBackground(containerRef);

  return (
    <TerrriaViewerContainer>
      <StyledMapPlaceholder>
        Loading the map, please wait...
      </StyledMapPlaceholder>
      <Splitter />
      <div
        data-testid="mapContainer"
        id="cesiumContainer"
        css={`
          cursor: auto;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
        `}
        ref={containerRef}
      />
    </TerrriaViewerContainer>
  );
};

/**
 * A hook to reactively set the map container background color from the base
 * map background color setting
 */
const useMapBackground = (containerRef: RefObject<HTMLElement>) => {
  const terria = useViewState().terria;

  useEffect(() => {
    const disposer = autorun(() => {
      // Only relevant when using leaflet mode
      if (terria.mainViewer.viewerMode !== ViewerMode.Leaflet) {
        return;
      }

      const containerBackground = terria.baseMapsModel.baseMapItems.find(
        (it) => it.item === terria.mainViewer.baseMap
      )?.backgroundColor;

      if (containerRef.current) {
        containerRef.current.style.backgroundColor = containerBackground ?? "";
      }
    });
    return disposer;
  }, [containerRef, terria]);
};

const TerrriaViewerContainer = styled.aside`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
`;

const StyledMapPlaceholder = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  color: black;
  text-align: center;
  width: 100%;
  height: 25%;
  margin: auto;
  @media (min-width: ${(p) => p.theme.sm}px) {
    color: white;
  }
`;
