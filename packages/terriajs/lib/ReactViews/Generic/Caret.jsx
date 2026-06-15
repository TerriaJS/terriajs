import styled from "styled-components";

export const Caret = styled.div`
  content: "";
  display: block;
  position: absolute;
  z-index: ${(props) => (props.zIndex ? `${props.zIndex}` : `-1`)};

  height: ${(props) => (props.size ? `${props.size}px` : `20px`)};
  width: ${(props) => (props.size ? `${props.size}px` : `20px`)};

  background: ${(props) =>
    props.background ? `${props.background}` : `${props.theme.textLight}`};

  transform: rotate(45deg);
`;

export default Caret;
