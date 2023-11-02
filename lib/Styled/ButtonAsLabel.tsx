import styled from "styled-components";
import Box from "./Box";

interface IButtonAsLabelProps {
  light?: boolean;
}

// a button styled thing which is actually just a label?
const ButtonAsLabel = styled(Box).attrs({
  centered: true,
  styledMinHeight: "32px"
})<IButtonAsLabelProps>`
  border-radius: 0 16px 16px 0;
  ${(props) =>
    props.light &&
    `
      background: ${props.theme.textLight};
      color: ${props.theme.textDark};
    `}
  ${(props) =>
    !props.light &&
    `
      background: ${props.theme.textBlack};
      color: ${props.theme.textLight};
    `}
`;

export default ButtonAsLabel;
