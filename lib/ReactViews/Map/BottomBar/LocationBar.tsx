import { observer } from "mobx-react";
import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import MouseCoords from "../../../ReactViewModels/MouseCoords";
import Box from "../../../Styled/Box";
import { RawButton } from "../../../Styled/Button";
import { TextSpan } from "../../../Styled/Text";

interface ILocationBarProps {
  mouseCoords: MouseCoords;
}

const Section = styled(Box).attrs({
  paddedHorizontally: true
})``;

const StyledText = styled(TextSpan).attrs({
  textLight: true,
  mono: true,
  noWrap: true
})`
  font-size: 0.7rem;
  padding: 0 5px 0 5px;
`;

export const LocationBar: FC<ILocationBarProps> = observer(
  ({ mouseCoords }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    return (
      <Box
        styledHeight="30px"
        col
        verticalCenter
        css={`
          padding-top: 3px;
          padding-bottom: 3px;
        `}
      >
        <RawButton
          css={`
            display: flex;
            align-items: center;
            height: 100%;
            &:hover {
              background: ${theme.colorPrimary};
            }
          `}
          onClick={mouseCoords.toggleUseProjection}
        >
          {!mouseCoords.useProjection ? (
            <>
              <Section centered>
                <StyledText>{t("legend.lat")}</StyledText>
                <StyledText>{mouseCoords.latitude}</StyledText>
              </Section>
              <Section centered>
                <StyledText>{t("legend.lon")}</StyledText>
                <StyledText>{mouseCoords.longitude}</StyledText>
              </Section>
            </>
          ) : (
            <>
              <Section>
                <StyledText>{t("legend.zone")}</StyledText>
                <StyledText>{mouseCoords.utmZone}</StyledText>
              </Section>
              <Section>
                <StyledText>{t("legend.e")}</StyledText>
                <StyledText>{mouseCoords.east}</StyledText>
              </Section>
              <Section>
                <StyledText>{t("legend.n")}</StyledText>
                <StyledText>{mouseCoords.north}</StyledText>
              </Section>
            </>
          )}
          <Section>
            <StyledText>{t("legend.elev")}</StyledText>
            <StyledText>{mouseCoords.elevation}</StyledText>
          </Section>
        </RawButton>
      </Box>
    );
  }
);
