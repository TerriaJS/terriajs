import styled from "styled-components";

import Hr from "../../../../Styled/Hr";

export const StyledHr = styled(Hr).attrs((props) => ({
  size: 1,
  borderBottomColor: props.theme.darkWithOverlay
}))`
  margin: 10px -10px;
`;
