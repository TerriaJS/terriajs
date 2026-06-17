import styled from "styled-components";
import { RawButton } from "../../Styled/Button";

export const TourProgressDot = styled(RawButton)`
  display: inline-block;
  box-sizing: border-box;
  height: 7px;
  width: 7px;
  border: 1px solid ${(p) => p.theme.colorPrimary};

  background-color: ${(p) => (p.active ? p.theme.colorPrimary : "transparent")};

  margin-left: 8px;
  border-radius: 50%;
`;

export default TourProgressDot;
