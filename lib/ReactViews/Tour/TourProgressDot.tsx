import styled from "styled-components";
import { RawButton } from "../../Styled/Button";

export const TourProgressDot = styled(RawButton)`
  display: inline-block;
  box-sizing: border-box;
  height: 7px;
  width: 7px;
  border: 1px solid ${(p) => p.theme.colorPrimary};

  // @ts-expect-error TS(2339): Property 'active' does not exist on type 'ThemedSt... Remove this comment to see the full error message
  background-color: ${(p) => (p.active ? p.theme.colorPrimary : "transparent")};

  margin-left: 8px;
  border-radius: 50%;
`;

export default TourProgressDot;
