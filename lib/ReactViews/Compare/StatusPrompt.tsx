import React from "react";
import styled from "styled-components";
import Button from "../../Styled/Button";
import Icon, { StyledIcon } from "../../Styled/Icon";

const StatusPrompt = styled.div`
  background-color: ${p => p.theme.colorPrimary};

  display: flex;
  flex-direction: row;
  align-items: center;

  min-height: 34px;
  padding-left: 16px;
  border-radius: 20px;
  border-right: 0px;

  font-size: 12px;
  line-height: 16px;
  color: ${p => p.theme.textLight};
`;

const CloseButton = styled(Button).attrs({
  primary: true,
  renderIcon: () => (
    <StyledIcon light styledWidth="10px" glyph={Icon.GLYPHS.close} />
  )
})`
  min-height: 34px;
  border-radius: 20px;
  border-right: 0px;
`;

export default StatusPrompt;
