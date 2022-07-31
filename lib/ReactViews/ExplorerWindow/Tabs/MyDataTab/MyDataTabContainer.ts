import styled from "styled-components";

import { Box } from "./../../../../Styled/Box";

export const MyDataTabContainer = styled(Box).attrs(props => ({
  column: true,
  styledMargin: "15px",
  paddedRatio: 4,
  rounded: true,
  centered: true,
  backgroundColor: props.theme.modalSecondaryBg,
  flex: "1",
  overflowY: "auto",
  scroll: true
}))``;
