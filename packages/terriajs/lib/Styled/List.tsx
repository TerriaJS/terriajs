import styled, { css } from "styled-components";
import Box from "./Box";

export const Li = styled.li``;
interface IUlProps {
  spaced?: boolean;
  lined?: boolean;
}

export const Ul = styled(Box).attrs({
  as: "ul"
})<IUlProps>`
  padding-left: 0;
  list-style: none;
  margin: 0;
  ${(props) =>
    props.fullWidth &&
    css`
      width: 100%;
      ${Li} {
        width: 100%;
      }
    `}
  ${(props) =>
    props.spaced &&
    css`
      ${Li}:not(:first-child) {
        padding-top: 5px;
      }
    `}
  ${(props) =>
    props.lined &&
    css`
      ${Li}:first-child {
        padding-bottom: 5px;
      }
      ${Li}:not(:first-child) {
        border-top: 1px solid grey;
      }
    `}
`;

export const Ol = styled(Ul).attrs({
  as: "ol"
})``;

export default Ul;
