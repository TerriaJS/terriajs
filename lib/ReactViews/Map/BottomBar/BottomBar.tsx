import { VFC } from "react";
import Box from "../../../Styled/Box";
import { useViewState } from "../../Context";
import { MapCredits } from "./Credits";
import { DistanceLegend } from "./DistanceLegend";
import { LocationBar } from "./LocationBar";
import { useTheme } from "styled-components";
import React from "react";

export const BottomBar: VFC = () => {
  const viewState = useViewState();
  return (
    <Box
      justifySpaceBetween
      css={`
        border-radius: 8px 8px 8px 8px;
        font-size: 0.7rem;
        width: 96%;
        background: ${useTheme().darkTranslucent};
        backdrop-filter: blur(5px);
        margin-top: 2px;
      `}
    >
      <MapCredits
        hideTerriaLogo={!!viewState.terria.configParameters.hideTerriaLogo}
        credits={viewState.terria.configParameters.extraCreditLinks?.slice()}
        currentViewer={viewState.terria.mainViewer.currentViewer}
      />
      <Box paddedHorizontally={4} gap={2}>
        {!viewState.useSmallScreenInterface && (
          <LocationBar
            mouseCoords={viewState.terria.currentViewer.mouseCoords}
          />
        )}
        <DistanceLegend />
      </Box>
    </Box>
  );
};
