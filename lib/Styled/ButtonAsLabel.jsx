import styled from "styled-components";
import Box from "./Box";

// a button styled thing which is actually just a label?
const ButtonAsLabel = styled(Box).attrs({
  centered: true,
  styledMinHeight: "32px"
})`
  border-radius: 0 16px 16px 0;
  ${props =>
    props.light &&
    `
      background: ${props.theme.textLight};
      color: ${props.theme.textDark};
    `}
  ${props =>
    props.dark &&
    `
      background: ${props.theme.textBlack};
      color: ${props.theme.textLight};
    `}
`;

export default ButtonAsLabel;
