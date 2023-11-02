import styled from "styled-components";

interface IProps {
  fullWidth?: boolean;
  size: number;
  borderBottomColor: string;
}

export const Hr = styled.hr<IProps>`
  margin: 0;
  border: none;
  ${(props) => props.fullWidth && `width: 100%;`}
  border-bottom: ${(props) => props.size}px solid;
  border-bottom-color: ${(props) => props.borderBottomColor};
`;

export default Hr;
