import styled from "styled-components";

export const Caret = styled.div`
  content: "";
  display: block;
  position: absolute;
  // @ts-expect-error TS(2339): Property 'zIndex' does not exist on type 'ThemedSt... Remove this comment to see the full error message
  z-index: ${(props) => (props.zIndex ? `${props.zIndex}` : `-1`)};

  // @ts-expect-error TS(2339): Property 'size' does not exist on type 'ThemedStyl... Remove this comment to see the full error message
  height: ${(props) => (props.size ? `${props.size}px` : `20px`)};
  // @ts-expect-error TS(2339): Property 'size' does not exist on type 'ThemedStyl... Remove this comment to see the full error message
  width: ${(props) => (props.size ? `${props.size}px` : `20px`)};

  background: ${(props) =>
    // @ts-expect-error TS(2339): Property 'background' does not exist on type 'Them... Remove this comment to see the full error message
    props.background ? `${props.background}` : `${props.theme.textLight}`};

  transform: rotate(45deg);
`;

export default Caret;
