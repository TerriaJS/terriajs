import styled from "styled-components";
import Box from "../../Styled/Box";

export const TourPrefaceBox = styled(Box)`
  position: fixed;
  width: 100%;
  height: 100%;
  background: ${(p) => (p.pseudoBg ? "black" : "transparent")};
  z-index: 1000;
  opacity: ${(p) => (p.pseudoBg ? 0.45 : 1)};
`;

export default TourPrefaceBox;
