import styled from "styled-components";
import Box from "../../../../Styled/Box";

export const CreditsContainer = styled(Box).attrs(() => ({
  styledHeight: "30px",
  styledMaxHeight: "30px",
  verticalCenter: true,
  gap: true
}))`
  a {
    text-decoration: underline;
    cursor: pointer;
    color: ${(props) => props.theme.textLight};
    display: flex;
    align-items: center;
  }
  img {
    height: 24px;
  }
`;
