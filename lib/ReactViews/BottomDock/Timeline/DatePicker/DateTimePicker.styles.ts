import styled from "styled-components";
import { RawButton } from "../../../../Styled/Button";
import Button from "../../../../Styled/Button";
import { scrollBars } from "../../../../Styled/mixins";

export const GridItem = styled.span<{ active: boolean }>`
  background: ${(p) => p.theme.overlay};
  ${(p) =>
    p.active &&
    `
    & {
      background: ${p.theme.colorPrimary};
    }
    opacity: 0.9;
   `}
`;

export const GridRowInner = styled.span<{ marginRight: string }>`
  display: table-row;
  padding: 3px;
  border-radius: 3px;

  span {
    display: inline-block;
    height: 10px;
    width: 2px;
    margin-top: 1px;
    margin-right: ${(p) => p.marginRight}px;
  }
`;

export const Grid = styled.div`
  display: block;
  width: 100%;
  height: 100%;
  margin: 0 auto;
  color: ${(p) => p.theme.textLight};
  padding: 0px 5px;
  border-radius: 3px;
  margin-top: -20px;
`;

export const GridHeading = styled.div`
  text-align: center;
  color: ${(p) => p.theme.textLight};
  font-size: 12px;
  margin-bottom: 10px;
`;

export const GridRow = styled.div`
  :hover {
    background: ${(p) => p.theme.overlay};
    cursor: pointer;
  }
`;

export const GridLabel = styled.span`
  float: left;
  display: inline-block;
  width: 35px;
  font-size: 10px;
  padding-left: 3px;
`;

export const GridBody = styled.div`
  height: calc(100% - 30px);
  overflow: auto;
  ${(p) => scrollBars(p)}
`;

export const BackButton = styled(RawButton)`
  display: inline-block;
  z-index: 99;
  position: relative;

  svg {
    height: 15px;
    width: 20px;
    fill: ${(p) => p.theme.textLight};
    display: inline-block;
    vertical-align: bottom;
  }

  &[disabled],
  &:disabled {
    opacity: 0.1;
  }
`;

export const DateButton = styled(Button).attrs({
  primary: true,
  textProps: { medium: true }
})`
  width: calc(100% - 20px);
  margin: 3px 5px;
  border-radius: 4px;
`;
