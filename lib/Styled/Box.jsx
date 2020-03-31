import styled from "styled-components";

export const Box = styled.div`
  ${props => props.relative && `position:relative;`}
  
  display: flex;
  position: relative;
  ${props =>
    props.positionAbsolute &&
    `
    position:absolute;
    z-index:1;
   `}

  box-sizing: border-box;


  ${props => props.rounded && `border-radius: ${props.theme.radiusLarge};`}

  ${props => props.fullHeight && `height: 100%;`}
  ${props => props.fullWidth && `width: 100%;`}
  ${props => props.styledWidth && `width: ${props.styledWidth};`}
  
  ${props =>
    props.col &&
    `
    float: left;
    box-sizing: border-box;
  `}

  // ${props => props.col1 && "width: 8.33333%;"}
  // ${props => props.col2 && "width: 16.66667%;"}
  // ${props => props.col3 && "width: 25%;"}
  // ${props => props.col4 && "width: 33.33333%;"}
  // ${props => props.col5 && "width: 41.66667%;"}
  // ${props => props.col6 && "width: 50%;"}
  // ${props => props.col7 && "width: 58.33333%;"}
  // ${props => props.col8 && "width: 66.66667%;"}
  // ${props => props.col9 && "width: 75%;"}
  // ${props => props.col10 && "width: 83.33333%;"}
  // ${props => props.col11 && "width: 91.66667%;"}
  // ${props => props.col12 && "width: 100%;"}

  ${props => props.centered && `align-items: center;`}
  ${props => props.centered && `justify-content: center;`}

  ${props =>
    props.justifyContentSpaceAround && `justify-content: space-around;`}
  ${props => props.justifySpaceBetween && `justify-content: space-between;`}
  
  ${props => props.left && `align-items: center;`}
  ${props => props.alignItemsFlexStart && `align-items: flex-start;`}
  ${props => props.left && `justify-content: flex-start;`}
  ${props => props.leftSelf && `align-self: flex-start;`}

  ${props => props.right && `align-items: center;`}
  ${props => props.alignItemsFlexEnd && `align-items: flex-end;`}
  ${props => props.right && `justify-content: flex-end;`}
  ${props => props.rightSelf && `align-self: flex-end;`}

  ${props => props.column && `flex-direction: column;`}
  ${props => props.wrap && `flex-wrap: wrap;`}

  ${props => props.flexShrinkZero && `flex-shrink: 0;`}

  ${props => props.boxShadow && `box-shadow: 0 2px 8px 0 rgba(0,0,0,0.16);`}

  /* Background colours? unsure how to handle this on theme level yet */
  ${props =>
    props.charcoalGreyBg && `background-color: ${props.theme.charcoalGrey};`}


  /* Unsure of padding API as yet */

  ${props => props.padded && `padding: 5px;`}
  
  ${props => props.paddedRatio && `padding: ${5 * props.paddedRatio}px;`}
  ${props =>
    props.paddedHorizontally &&
    `
      padding-left:${5 *
        (props.paddedHorizontally === true ? 1 : props.paddedHorizontally)}px;
      padding-right:${5 *
        (props.paddedHorizontally === true ? 1 : props.paddedHorizontally)}px;
    `}
  ${props =>
    props.paddedVertically &&
    `
      padding-top: ${5 *
        (props.paddedVertically === true ? 1 : props.paddedVertically)}px;
      padding-bottom: ${5 *
        (props.paddedVertically === true ? 1 : props.paddedVertically)}px;
    `}
`;

export const BoxSpan = styled(Box).attrs({
  as: "span"
})``;

export default Box;
