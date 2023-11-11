import styled from "styled-components";
import { RawButton } from "../../Styled/Button";

export const ActionButton = styled(RawButton)`
  display: flex;
  align-items: center;

  svg {
    height: 20px;
    width: 20px;
    padding: 5px 5px 5px 0;
    fill: ${(p) => p.theme.charcoalGrey};
  }

  &:hover,
  &:focus {
    svg {
      fill: ${(p) => p.theme.modalHighlight};
    }
  }
`;
