import { observer } from "mobx-react";
import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import Box, { BoxSpan } from "../../Styled/Box";
import { RawButton } from "../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../Styled/Icon";
import Spacing from "../../Styled/Spacing";
import Text from "../../Styled/Text";
import { useViewState } from "../Context";

export interface FrameProps {
  title: string;
  children: React.ReactNode;
}

export const Frame = observer((props: FrameProps) => {
  const theme = useTheme();
  const [showChildren, setShowChildren] = useState(true);
  const viewState = useViewState();
  return (
    <Wrapper isMapFullScreen={viewState.isMapFullScreen}>
      <Toggle
        paddedVertically
        paddedHorizontally={2}
        centered
        justifySpaceBetween
        backgroundColor={theme.toolPrimaryColor}
      >
        <Title title={props.title} icon={GLYPHS.search} />
        {/* margin-right 5px for the padded button offset - larger click area
          but visible should be inline with rest of box */}
        <Box centered css={"margin-right:-5px;"}>
          <ToolCloseButton />
          <Spacing right={4} />
          {/* collapse button */}
          <RawButton onClick={() => setShowChildren(!showChildren)}>
            <BoxSpan paddedRatio={1} centered>
              <StyledIcon
                styledWidth="12px"
                light
                glyph={showChildren ? GLYPHS.opened : GLYPHS.closed}
              />
            </BoxSpan>
          </RawButton>
        </Box>
      </Toggle>
      {showChildren && props.children}
    </Wrapper>
  );
});

export const Main = styled(Text)`
  display: flex;
  flex-direction: column;
  padding: 15px;
  overflow-y: auto;
  ${({ theme }) => theme.borderRadiusBottom(theme.radius40Button)}
  background-color: ${(p) => p.theme.darkWithOverlay};
  min-height: 350px;
`;

const Wrapper = styled(Box).attrs({
  column: true,
  position: "absolute",
  styledWidth: "340px"
  // charcoalGreyBg: true
})<{ isMapFullScreen: boolean }>`
  top: 70px;
  left: 0px;
  min-height: 220px;
  // background: ${(p) => p.theme.dark};
  margin-left: ${(props) =>
    props.isMapFullScreen
      ? 16
      : parseInt(props.theme.workbenchWidth, 10) + 40}px;
  transition: margin-left 0.25s;
`;

const Toggle = styled(Box)`
  ${({ theme }) => theme.borderRadiusTop(theme.radius40Button)}
`;

const ToolCloseButton = () => {
  const viewState = useViewState();
  const { t } = useTranslation();
  return (
    <RawButton onClick={() => viewState.closeTool()}>
      <Text textLight small semiBold uppercase>
        {t("tool.exitBtnTitle")}
      </Text>
    </RawButton>
  );
};

interface TitleProps {
  title: string;
  icon?: { id: string };
}

const Title = (props: TitleProps) => {
  return (
    <Box centered>
      <Box>
        {props.icon && (
          <StyledIcon styledWidth="20px" light glyph={props.icon} />
        )}
      </Box>
      <Spacing right={1} />
      <TitleText
        textLight
        semiBold
        // font-size is non standard with what we have so far in terria,
        // lineheight as well to hit nonstandard paddings
        styledFontSize="17px"
        styledLineHeight="30px"
        overflowEllipsis
        overflowHide
        noWrap
      >
        {props.title}
      </TitleText>
    </Box>
  );
};

const TitleText = styled(Text)`
  flex-grow: 2;
  max-width: 220px;
`;
