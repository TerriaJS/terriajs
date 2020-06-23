import React from "react";
import PropTypes from "prop-types";
import { observer } from "mobx-react";

import Icon, { StyledIcon } from "../Icon";
import ButtonAsLabel from "../../Styled/ButtonAsLabel";
import Box from "../../Styled/Box";
import Text from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import { withTranslation } from "react-i18next";

const MapDataCount = withTranslation()(
  observer(function(props) {
    const { t, terria, viewState } = props;
    if (viewState.useSmallScreenInterface) {
      return null;
    }

    // Can't simply use number of items given they can exist in workbench
    // without being shown on map
    const numberOfDatasets = terria.workbench.items.filter(item => item.show)
      .length;
    const hasMapData = numberOfDatasets !== 0;
    const dataset = t("countDatasets.datasetSingular");
    const datasetPlural = t("countDatasets.datasetPlural");
    const singularOrPlural =
      numberOfDatasets > 1 || numberOfDatasets === 0 ? datasetPlural : dataset;
    const mapDataText = hasMapData
      ? t("countDatasets.mapDataState", {
          numberOfDatasets,
          singularOrPlural
        })
      : t("countDatasets.noMapDataEnabled");

    return (
      <Box positionAbsolute css={" top: -72px; "}>
        <ButtonAsLabel light={hasMapData} dark={!hasMapData}>
          <Spacing right={1} />
          <StyledIcon
            glyph={
              hasMapData
                ? Icon.GLYPHS.mapDataActive
                : Icon.GLYPHS.mapDataInactive
            }
            light={!hasMapData}
            dark={hasMapData}
            styledWidth={"20px"}
          />
          <Spacing right={2} />
          <Text semiBold>{mapDataText}</Text>
          <Spacing right={3} />
        </ButtonAsLabel>
      </Box>
    );
  })
);
MapDataCount.propTypes = {
  t: PropTypes.object.isRequired,
  terria: PropTypes.object.isRequired,
  viewState: PropTypes.object.isRequired
};

export default MapDataCount;
