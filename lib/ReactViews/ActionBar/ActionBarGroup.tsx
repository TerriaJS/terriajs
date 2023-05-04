import styled from "styled-components";
import Box from "../../Styled/Box";
import StyledButton from "./StyledButton";

/**
 * Visually groups the child {@link ActionButton} elements.
 */
const ActionBarGroup = styled(Box)`
  margin-right: 8px;

  ${StyledButton} {
    margin-right: 0;
  }

  ${StyledButton}:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  ${StyledButton}:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

export default ActionBarGroup;
