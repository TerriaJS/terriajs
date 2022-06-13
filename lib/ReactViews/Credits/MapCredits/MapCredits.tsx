import { reaction } from "mobx";
import { observer } from "mobx-react";
import React, { FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDataAttributionContext } from "../../../ReactContexts/DataAttributionContext";
import { Credits, Spacer } from "../Credits";
import { CreditsContainer } from "../CreditsContainer";
import { DataAttributionModal } from "../DataAttribution/DataAttributionModal";
import { TerriaLogo } from "../TerriaLogo";
import { MapCreditLogo } from "./MapCreditLogo";
import { IMapCreditsProps } from "./MapCredits.props";

export const MapCredits: FC<IMapCreditsProps> = observer(
  ({ currentViewer, hideTerriaLogo, credits }) => {
    const { t } = useTranslation();
    const {
      dataAttributionVisible,
      showDataAttribution,
      hideDataAttribution
    } = useDataAttributionContext();

    useEffect(() => {
      return reaction(
        () => currentViewer.attributions.length,
        () => {
          if (
            currentViewer.attributions &&
            currentViewer.attributions.length === 0
          ) {
            hideDataAttribution();
          }
        }
      );
    }, [currentViewer]);

    if (currentViewer.type === "none") {
      return <CreditsContainer />;
    }

    return (
      <CreditsContainer>
        {!hideTerriaLogo ? <TerriaLogo /> : null}
        <MapCreditLogo currentViewer={currentViewer} />
        <Credits credits={credits}></Credits>
        <Spacer />
        {currentViewer.attributions && currentViewer.attributions.length > 0 ? (
          <a onClick={showDataAttribution}>
            {t("map.extraCreditLinks.basemap")}
          </a>
        ) : null}
        {dataAttributionVisible ? (
          <DataAttributionModal
            closeModal={hideDataAttribution}
            attributions={currentViewer.attributions}
          />
        ) : null}
      </CreditsContainer>
    );
  }
);
