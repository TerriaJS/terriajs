import styled from "styled-components";

// should it be a span or inline-block-div? - leaning to div
export const Text = styled.div`
  ${props =>
    props.primary &&
    `
    color: ${props.theme.colorPrimary};
  `}
  ${props =>
    props.textLight &&
    `
    color: ${props.theme.textLight};
  `}

  ${props => props.fullWidth && `width: 100%;`}
  ${props => props.noWrap && `white-space: nowrap;`}
`;

export default Text;
