import styled from "styled-components";
import { RawButton } from "../../Styled/Button";

export const ActionButton = styled(RawButton)`
  svg {
    height: 20px;
    width: 20px;
    padding: 5px;
    fill: ${(p) => p.theme.charcoalGrey};
  }

  &:hover,
  &:focus {
    svg {
      fill: ${(p) => p.theme.modalHighlight};
    }
  }
`;
