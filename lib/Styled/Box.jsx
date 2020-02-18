import styled from "styled-components";

export const Box = styled.div`
  ${props => props.relative && `position:relative;`}

  display: flex;
  position: relative;

  ${props => props.fullHeight && `height: 100%;`}
  ${props => props.fullWidth && `width: 100%;`}
  
  

  ${props => props.centered && `align-items: center;`}
  ${props => props.centered && `justify-content: center;`}

  ${props => props.justifySpaceBetween && `justify-content: space-between;`}
  
  ${props => props.left && `align-items: center;`}
  ${props => props.left && `justify-content: flex-start;`}
  ${props => props.leftSelf && `align-self: flex-start;`}

  ${props => props.right && `align-items: center;`}
  ${props => props.right && `justify-content: flex-end;`}
  ${props => props.rightSelf && `align-self: flex-end;`}

  ${props => props.column && `flex-direction: column;`}
  ${props => props.wrap && `flex-wrap: wrap;`}

  ${props => props.boxShadow && `box-shadow: 0 2px 8px 0 rgba(0,0,0,0.16);`}


  /* Unsure of padding API as yet */
  ${props => props.padded && `padding: 16px;`}
  
  ${props => props.paddedRatio && `padding: ${4 * props.paddedRatio}px;`}
  ${props =>
    props.paddedHorizontally && `padding: 0 ${4 * props.paddedHorizontally}px;`}
  ${props =>
    props.paddedVertically && `padding: ${4 * props.paddedVertically}px 0;`}
`;

export default Box;
