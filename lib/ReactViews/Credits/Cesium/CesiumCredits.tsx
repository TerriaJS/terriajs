import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import Box from "../../../Styled/Box";
import { Credits, Spacer } from "../Credits";
import { TerriaLogo } from "../TerriaLogo";
import { VanillaChildren } from "../VanillaChildren";
import { ICesiumCreditsProps } from "./CesiumCredits.props";

export const CesiumCredits: FC<ICesiumCreditsProps> = ({
  hideTerriaLogo,
  credits,
  expandDataCredits,
  cesiumLogoElement
}) => {
  const { t } = useTranslation();

  return (
    <Box verticalCenter gap>
      {!hideTerriaLogo ? <TerriaLogo /> : null}
      {cesiumLogoElement ? (
        <VanillaChildren children={cesiumLogoElement} />
      ) : null}
      <Credits credits={credits}></Credits>
      <Spacer />
      <a onClick={expandDataCredits}>{t("map.extraCreditLinks.basemap")}</a>
    </Box>
  );
};
