import React, { useState } from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import Icon from "../Icon.jsx";
import Box from "../../Styled/Box";
import { TextSpan } from "../../Styled/Text";
import Spacing from "../../Styled/Spacing";
import MapIconButton from "../MapIconButton/MapIconButton";
// import MenuPanel from "../StandardUserInterface/customizable/MenuPanel";
import CleanDropdownPanel from "../CleanDropdownPanel/CleanDropdownPanel";

GyroscopeGuidance.propTypes = {
  viewState: PropTypes.object,
  onClose: PropTypes.func
};

const Text = styled(TextSpan).attrs({
  textAlignLeft: true
})``;

const CompassWrapper = styled(Box).attrs({
  centered: true
})`
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  margin-right: 10px;
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
  // TODO: i18inify
  return (
    <Box
      column
      css={`
        direction: ltr;
        min-width: 295px;
        padding: 20px;
      `}
    >
      <Text large>Gyroscope Contols</Text>
      <Spacing bottom={4} />
      <Box>
        <CompassWrapper>
          <CompassIcon glyph={Icon.GLYPHS.compassOuter} />
          <CompassIcon glyph={Icon.GLYPHS.compassInnerArrows} inner darken />
        </CompassWrapper>
        <Box column>
          <Text bold uppercase>
            Outer Ring
          </Text>
          <Spacing bottom={1} />
          <Text>
            Drag the outer ring in a circular motion to rotate the map view
            360˚.
          </Text>
        </Box>
      </Box>
      <Spacing bottom={4} />
      <Box>
        <CompassWrapper>
          <CompassIcon
            glyph={Icon.GLYPHS.compassOuter}
            css={CompassPositioning}
            darken
          />
          <CompassIcon glyph={Icon.GLYPHS.compassInnerArrows} inner />
          <Spacing right={2} />
        </CompassWrapper>
        <Box column>
          <Text bold uppercase>
            Inner Circle
          </Text>
          <Spacing bottom={1} />
          <Text>
            Click in the centre and slowly drag up, down, left or right to tilt
            and rotate the map at the same time.
          </Text>
          <Spacing bottom={2} />
          <Text>Double click in here to reset view to its default state.</Text>
        </Box>
      </Box>
      <Spacing bottom={4} />
      <Text>
        You can also tilt and rotate the map by holding the CTRL key and
        dragging the map.
      </Text>
      {/* <Text>
        Click here to find out more about the controls and how to use them.
      </Text> */}
    </Box>
  );
}

export default function GyroscopeGuidance(props) {
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <Box
      css={`
        position: absolute;
        direction: rtl;
        right: 75px;
        top: 17px;
      `}
    >
      <MapIconButton
        neverCollapse
        onClick={() => props.viewState.showHelpPanel()}
        iconElement={() => <Icon glyph={Icon.GLYPHS.helpThick} />}
      >
        Help
      </MapIconButton>
      <Spacing right={2} />
      <div
        css={`
          position: relative;
        `}
      >
        <MapIconButton
          neverCollapse
          iconElement={() => <Icon glyph={Icon.GLYPHS.controls} />}
          onClick={() => setControlPanelOpen(!controlPanelOpen)}
        >
          Controls
        </MapIconButton>
        <div
          onClick={e => e.preventDefault()}
          css={`
            position: relative;
          `}
        >
          <CleanDropdownPanel
            // theme={dropdownTheme}
            isOpen={controlPanelOpen}
            onOpenChanged={() => controlPanelOpen}
            // onDismissed={() => setControlPanelOpen(false)}
            btnTitle={t("settingPanel.btnTitle")}
            btnText={t("settingPanel.btnText")}
            viewState={props.viewState}
            smallScreen={props.viewState.useSmallScreenInterface}
          >
            <GyroscopeGuidancePanel />
          </CleanDropdownPanel>
        </div>
      </div>
      <Spacing right={2} />
      <div
        css={`
          transform: scale(0.75);
          transform-origin: right;
          svg {
            fill: ${p => p.theme.textLight};
            width: 15px;
            height: 15px;
          }
        `}
      >
        <MapIconButton
          inverted
          onClick={props.onClose}
          iconElement={() => <Icon glyph={Icon.GLYPHS.closeLight} />}
        />
      </div>
    </Box>
  );
}
