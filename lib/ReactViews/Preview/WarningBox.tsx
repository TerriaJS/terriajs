import React from "react";
import styled from "styled-components";
import Box from "../../Styled/Box";
import Spacing from "../../Styled/Spacing";

// Hard code colour for now
const warningColor = "#f69900";

const Triangle = styled.p`
  width: 0px;
  height: 0px;
  text-indent: -2px;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid white;
  font-weight: bold;
  line-height: 25px;
  user-select: none;
`;

// Equilateral triangle
const WarningIcon = () => <Triangle>!</Triangle>;

const WarningBox: React.FC = ({ children }) => (
  <Box backgroundColor={warningColor} rounded padded>
    <Spacing right={1} />
    <WarningIcon />
    <Spacing right={2} />
    <Box backgroundColor="#ffffff" rounded fullWidth paddedRatio={3}>
      {children}
    </Box>
  </Box>
);

export default WarningBox;
