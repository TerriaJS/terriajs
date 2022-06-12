import React, { FC } from "react";
import Box from "../../../Styled/Box";
import parseCustomHtmlToReact from "../../Custom/parseCustomHtmlToReact";
import { Credits, Spacer } from "../Credits";
import { TerriaLogo } from "../TerriaLogo";
import { ILeafletCreditsProps } from "./LeafletCredits.props";

export const LeafletCredits: FC<ILeafletCreditsProps> = ({
  hideTerriaLogo,
  prefix,
  credits,
  dataAttributions
}) => {
  return (
    <Box verticalCenter gap>
      {!hideTerriaLogo ? <TerriaLogo /> : null}
      {prefix ? parseCustomHtmlToReact(prefix) : null}
      <Spacer />
      <Credits credits={credits}></Credits>
      <Spacer />
      {parseCustomHtmlToReact(dataAttributions.join(","))}
    </Box>
  );
};
