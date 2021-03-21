import styled from "styled-components";
import Box from "./Box";

interface IUlProps {
  overflowX?: string;
}

export const Ul = styled(Box).attrs({
  as: "ul"
})<IUlProps>`
  list-style: none;
  margin: 0;
  ${props =>
    props.overflowX &&
    `
        overflow-x: ${props.overflowX};
      `}
`;

export const Li = styled.li``;

export const Ol = styled(Ul).attrs({
  as: "ol"
})``;

export default Ul;
