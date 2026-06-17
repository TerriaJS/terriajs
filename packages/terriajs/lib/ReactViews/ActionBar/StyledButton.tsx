import styled from "styled-components";
import Button from "../../Styled/Button";

const StyledButton = styled(Button)<{
  backgroundColor: string;
  hoverBackgroundColor?: string;
}>`
  background-color: ${(props) => props.backgroundColor};
  color: ${(props) => props.theme.textLight};
  border: 1px solid ${(props) => props.theme.darkLighter};

  margin-right: 8px;
  &:first-child {
    margin-left: 8px;
  }

  ${(props) =>
    props.hoverBackgroundColor &&
    `&:hover { background-color: ${props.hoverBackgroundColor} }`}
`;

export default StyledButton;
