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
  border-radius: 16px 16px 16px 16px;
  background: ${(p) => p.theme.darkTranslucent};
  ${(props) => props.light && ` color: ${props.theme.textDark}; `}
  ${(props) => !props.light && ` color: ${props.theme.textLight}; `}
`;

export default ButtonAsLabel;
