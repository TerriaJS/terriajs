import React, { useState, useRef } from "react";
import styled, { css } from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import Icon from "../Icon.jsx";
import Box from "../../Styled/Box";
import { TextSpan } from "../../Styled/Text";
import { RawButton } from "../../Styled/Button";
import Spacing from "../../Styled/Spacing";
import MapIconButton from "../MapIconButton/MapIconButton";
// import MenuPanel from "../StandardUserInterface/customizable/MenuPanel";
import CleanDropdownPanel from "../CleanDropdownPanel/CleanDropdownPanel";

GyroscopeGuidance.propTypes = {
  viewState: PropTypes.object.isRequired,
  handleHelp: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

const Text = styled(TextSpan).attrs({
  textAlignLeft: true,
  noFontSize: true
})``;

const CompassWrapper = styled(Box).attrs({
  centered: true,
  styledWidth: "64px",
  styledHeight: "64px"
})`
  flex-shrink: 0;

  svg {
    fill: ${props => props.theme.textDarker};
  }
`;
const CompassPositioning = `

`;
const CompassIcon = styled(Icon)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  ${props =>
    props.inner
      ? `
      fill: ${props.theme.textDarker};
      width: 26px;
      height: 26px;
    `
      : `
      fill: ${props.theme.textLight};
      width: 64px;
      height: 64px;
    `}
  ${props =>
    props.darken &&
    `
      opacity: 0.2;
    `}
`;

function GyroscopeGuidancePanel(props) {
  const { t } = useTranslation();
  // TODO: i18inify
  return (
    <Box
      column
      paddedRatio={4}
      css={`
        direction: ltr;
        min-width: 295px;
      `}
    >
      <Text large>{t("gyroscope.controls")}</Text>
      <Spacing bottom={4} />
      <Text medium>
        <Box>
          <CompassWrapper>
            <CompassIcon glyph={Icon.GLYPHS.compassOuterEnlarged} />
            <CompassIcon glyph={Icon.GLYPHS.compassInnerArrows} inner darken />
          </CompassWrapper>
          <Spacing right={2} />
          <Box column>
            <Text bold uppercase>
              {t("gyroscope.outerRingTitle")}
            </Text>
            <Spacing bottom={1} />
            <Text>{t("gyroscope.outerRingText")}</Text>
          </Box>
        </Box>
        <Spacing bottom={4} />
        <Box>
          <CompassWrapper>
            <CompassIcon
              glyph={Icon.GLYPHS.compassOuterEnlarged}
              css={CompassPositioning}
              darken
            />
            <CompassIcon glyph={Icon.GLYPHS.compassInnerArrows} inner />
            <Spacing right={2} />
          </CompassWrapper>
          <Spacing right={2} />
          <Box column>
            <Text bold uppercase>
              {t("gyroscope.innerRingTitle")}
            </Text>
            <Spacing bottom={1} />
            <Text>{t("gyroscope.innerRingText1")}</Text>
            <Spacing bottom={2} />
            <Text>{t("gyroscope.innerRingText2")}</Text>
          </Box>
        </Box>
        <Spacing bottom={4} />
        <Text>{t("gyroscope.ctrlTilt")}</Text>
        <Spacing bottom={4} />
        <RawButton onClick={props.handleHelp}>
          <Text displayBlock primary isLink>
            {t("gyroscope.findMore")}
          </Text>
        </RawButton>
      </Text>
    </Box>
  );
}

GyroscopeGuidancePanel.propTypes = {
  handleHelp: PropTypes.func.isRequired
};

export default function GyroscopeGuidance(props) {
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const controlsMapIcon = useRef();
  const { t } = useTranslation();
  return (
    <>
      <MapIconButton
        roundRight
        neverCollapse
        onClick={props.handleHelp}
        iconElement={() => <Icon glyph={Icon.GLYPHS.helpThick} />}
      >
        {t("gyroscope.helpBtn")}
      </MapIconButton>
      <Spacing marginRight={1} />
      <div
        css={`
          position: relative;
        `}
      >
        <MapIconButton
          roundLeft
          buttonRef={controlsMapIcon}
          neverCollapse
          iconElement={() => <Icon glyph={Icon.GLYPHS.controls} />}
          onClick={() => setControlPanelOpen(!controlPanelOpen)}
        >
          {t("gyroscope.controlsBtn")}
        </MapIconButton>
        <div
          onClick={e => e.preventDefault()}
          css={`
            position: relative;
          `}
        >
          <CleanDropdownPanel
            // theme={dropdownTheme}

            // While opacity at this level is not ideal, it's the only way
            // to get the background to be transparent - another step up
            // is setting the opacity layer underneath, and a
            // pseudo-panel on top of it to keep the opacity on top.
            // but that's a lot to do right now
            //   - for a component that is still using sass
            //   - for 0.85 where the contrast is still great.
            cleanDropdownPanelStyles={css`
              opacity: 0.85;
              .tjs-sc-InnerPanel,
              .tjs-sc-InnerPanel__caret {
                background: ${p => p.theme.textBlack};
              }
            `}
            refForCaret={controlsMapIcon}
            isOpen={controlPanelOpen}
            onOpenChanged={() => controlPanelOpen}
            // onDismissed={() => setControlPanelOpen(false)}
            btnTitle={t("settingPanel.btnTitle")}
            btnText={t("settingPanel.btnText")}
            viewState={props.viewState}
            smallScreen={props.viewState.useSmallScreenInterface}
          >
            <GyroscopeGuidancePanel handleHelp={props.handleHelp} />
          </CleanDropdownPanel>
        </div>
      </div>
      <Spacing right={2} />
      <div
        css={`
          transform: scale(0.75);
          transform-origin: right;
          svg {
            width: 15px;
            height: 15px;
          }
        `}
      >
        <MapIconButton
          css={"opacity: 0.8;"}
          inverted
          onClick={props.onClose}
          iconElement={() => <Icon glyph={Icon.GLYPHS.closeLight} />}
        />
      </div>
    </>
  );
}
