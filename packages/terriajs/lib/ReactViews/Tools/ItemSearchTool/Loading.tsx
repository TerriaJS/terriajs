import styled from "styled-components";
import Loader from "../../Loader";

const Loading = styled(Loader).attrs((props) => ({
  light: true,
  message: props.children
}))`
  align-self: center;
`;

export default Loading;
