import styled from "styled-components";

// should it be a span or inline-block-div? - leaning to div
export const Text = styled.div`
  ${props =>
    props.primary &&
    `
    color: ${props.theme.colorPrimary};
  `}

  ${props => props.fullWidth && `width: 100%;`}
`;

export default Text;
