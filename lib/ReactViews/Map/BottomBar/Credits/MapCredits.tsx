import { reaction } from "mobx";
import { observer } from "mobx-react";
import { FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobeOrMap from "../../../../Models/GlobeOrMap";
import { SearchBarModel } from "../../../../Models/SearchProviders/SearchBarModel";
import { ICredit } from "./Credit.type";
import { Credits } from "./Credits";
import { CreditsContainer } from "./CreditsContainer";
import { DataAttributionModal } from "./DataAttribution/DataAttributionModal";
import { MapCreditLogo } from "./MapCreditLogo";
import { Spacer } from "./Spacer";
import { TerriaLogo } from "./TerriaLogo";

interface IMapCreditsProps {
  hideTerriaLogo: boolean;
  credits?: ICredit[];
  currentViewer: GlobeOrMap;
  searchBarModel: SearchBarModel;
}

export const MapCredits: FC<IMapCreditsProps> = observer(
  ({ currentViewer, hideTerriaLogo, credits, searchBarModel }) => {
    const { t } = useTranslation();
    const [dataAttributionVisible, setDataAttributionVisible] = useState(false);

    const searchAttributions = searchBarModel.locationSearchProvidersArray
      .map((provider) => {
        return provider.attributions?.flat();
      })
      .flat()
      .filter((attribution) => !!attribution);

    const showDataAttribution = useCallback(() => {
      setDataAttributionVisible(true);
    }, [setDataAttributionVisible]);

    const hideDataAttribution = useCallback(() => {
      setDataAttributionVisible(false);
    }, [setDataAttributionVisible]);

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
      /* eslint-disable-next-line react-hooks/exhaustive-deps */
    }, [currentViewer]);

    if (currentViewer.type === "none") {
      return <CreditsContainer />;
    }

    return (
      <CreditsContainer>
        {!hideTerriaLogo ? <TerriaLogo /> : null}
        <MapCreditLogo currentViewer={currentViewer} />
        <Credits credits={credits} />
        <Spacer />
        {(currentViewer.attributions &&
          currentViewer.attributions.length > 0) ||
        currentViewer.attributions.length > 0 ? (
          <a onClick={showDataAttribution}>
            {t("map.extraCreditLinks.credits")}
          </a>
        ) : null}
        {dataAttributionVisible ? (
          <DataAttributionModal
            closeModal={hideDataAttribution}
            attributions={currentViewer.attributions}
            searchAttributions={searchAttributions}
          />
        ) : null}
      </CreditsContainer>
    );
  }
);
