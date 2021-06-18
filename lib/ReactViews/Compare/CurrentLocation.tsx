import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Cartographic from "terriajs-cesium/Source/Core/Cartographic";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import prettifyCoordinates from "../../Map/prettifyCoordinates";
import Button from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";
import Text from "../../Styled/Text";

type CurrentLocationProps = {
  location: Cartesian3;
  onClear: () => void;
};

/**
 * A component showing the current selected location of the location filter.
 */
const CurrentLocation: React.FC<CurrentLocationProps> = ({
  location,
  onClear
}) => {
  const cartographic = Cartographic.fromCartesian(location);
  const { latitude, longitude } = prettifyCoordinates(
    CesiumMath.toDegrees(cartographic.longitude),
    CesiumMath.toDegrees(cartographic.latitude)
  );
  const [t] = useTranslation();
  return (
    <Container>
      <Text small textLight>
        {t("compare.dateLocationFilter.location", { latitude, longitude })}
      </Text>
      <CloseButton onClick={onClear} />
    </Container>
  );
};

const Container = styled.div`
  background-color: ${p => p.theme.colorPrimary};

  display: flex;
  flex-direction: row;
  align-items: center;

  min-height: 34px;
  padding-left: 16px;
  border-radius: 20px;
  border-right: 0px;
`;

const CloseButton = styled(Button).attrs({
  primary: true,
  renderIcon: () => (
    <StyledIcon light styledWidth="10px" glyph={Icon.GLYPHS.close} />
  )
})`
  min-height: 34px;
  border-radius: 20px;
  border-right: 0px;
`;

export default CurrentLocation;
