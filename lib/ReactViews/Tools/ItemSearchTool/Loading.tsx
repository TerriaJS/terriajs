import styled from "styled-components";

const Loader: any = require("../../Loader");

const Loading = styled(Loader).attrs(props => ({
  light: true,
  message: props.children
}))`
  align-self: center;
`;

export default Loading;
