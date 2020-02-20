import React from "react";
// import styled from "styled-components";
import PropTypes from "prop-types";

import Icon from "../Icon.jsx";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";
import MapIconButton from "../MapIconButton/MapIconButton";

GyroscopeGuidance.propTypes = {
  onClose: PropTypes.func
};

export default function GyroscopeGuidance(props) {
  return (
    <Box
      css={`
        position: absolute;
        direction: rtl;
        right: 65px;
        top: 11px;
      `}
    >
      <MapIconButton
        iconElement={() => <Icon glyph={Icon.GLYPHS.help} />}
        // buttonText="Help"
      >
        Help
      </MapIconButton>
      <Spacing right={2} />
      <MapIconButton
        iconElement={() => <Icon glyph={Icon.GLYPHS.controls} />}
        // buttonText="Controls"
      >
        Controls
      </MapIconButton>
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
          onClick={props.onClose}
          iconElement={() => <Icon glyph={Icon.GLYPHS.closeLight} />}
        />
      </div>
    </Box>
  );
}
