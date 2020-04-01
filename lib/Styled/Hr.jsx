import styled from "styled-components";

export const Hr = styled.hr`
  margin:0;
  border: none;
  ${props => props.fullWidth && `width: 100%;`}
  border-bottom: ${props => props.size}px solid;
  border-bottom-color: ${props => props.borderBottomColor};
`;

export default Hr;
