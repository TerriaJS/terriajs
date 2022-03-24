import styled from "styled-components";
import { GLYPHS, StyledIcon } from "./Icon";

const AnimatedSpinnerIcon = styled(StyledIcon).attrs({
  glyph: GLYPHS.loader
})`
  animation: spin 2s infinite linear;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(359deg);
    }
  }
`;

export default AnimatedSpinnerIcon;
