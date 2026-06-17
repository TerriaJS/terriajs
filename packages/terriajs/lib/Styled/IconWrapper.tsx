import styled from "styled-components";

interface IconWrapperProps {
  width?: number;
  marginRight?: boolean;
  wide?: boolean;
}

export const IconWrapper = styled.span<IconWrapperProps>`
  display: grid;

  // ${(props) => `width: ${props.width || 16}px`};
  & > * {
    margin: auto;
  }
  ${(props) => props.marginRight && `margin-right: 8px;`}

  flex-shrink: 0;
  ${(props) => props.wide && `margin: auto 16px;`}
`;

export default IconWrapper;
