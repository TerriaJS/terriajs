import styled from "styled-components";
import Box from "../../Styled/Box";

export const CreditsContainer = styled(Box).attrs(() => ({
  fullWidth: true,
  styledHeight: "30px",
  styledMaxHeight: "30px",
  verticalCenter: true,
  gap: true,
  position: "absolute"
}))`
  z-index: 0;
  bottom: 0;
  background: linear-gradient(180deg, #000000 0%, #000000 100%);
  font-size: 0.7rem;
  opacity: 0.75;
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
