import styled from "styled-components";

import { StyledIcon, GLYPHS } from "./Icon";

const AnimatedSpinnerIcon = styled(StyledIcon).attrs({
  glyph: GLYPHS.loader
})`
  -webkit-animation: spin 2s infinite linear;
  animation: spin 2s infinite linear;

  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(359deg);
      transform: rotate(359deg);
    }
  }

  @keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(359deg);
      transform: rotate(359deg);
    }
  }
`;

export default AnimatedSpinnerIcon;
