import styled from "styled-components";

export const ProgressDot = styled.div`
  display: inline-block;
  box-sizing: border-box;
  height: 7px;
  width: 7px;
  border: 1px solid ${p => p.theme.colorPrimary};

  background-color: ${p =>
    p.count < p.countStep ? p.theme.colorPrimary : "transparent"};

  margin-left: 8px;
  border-radius: 50%;
`;

export default ProgressDot;
