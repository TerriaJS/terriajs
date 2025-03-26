import { VFC } from "react";
import Box from "../../../Styled/Box";
import { useViewState } from "../../Context";
import { MapCredits } from "./Credits";
import { DistanceLegend } from "./DistanceLegend";
import { LocationBar } from "./LocationBar";
import { useTheme } from "styled-components";

export const BottomBar: VFC = () => {
  const viewState = useViewState();
  const theme = useTheme();
  return (
    <Box
      fullWidth
      justifySpaceBetween
      css={`
        background: ${theme.transparentDark};
        backdrop-filter: ${theme.blur};
        font-size: 0.7rem;
      `}
    >
      <MapCredits
        hideTerriaLogo={!!viewState.terria.configParameters.hideTerriaLogo}
        credits={viewState.terria.configParameters.extraCreditLinks?.slice()}
        currentViewer={viewState.terria.mainViewer.currentViewer}
      />
      <Box paddedHorizontally={4} gap={2}>
        <LocationBar mouseCoords={viewState.terria.currentViewer.mouseCoords} />
        <DistanceLegend />
      </Box>
    </Box>
  );
};
