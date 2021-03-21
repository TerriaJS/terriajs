import styled from "styled-components";

type Overflow =
  | "visible"
  | "hidden"
  | "scroll"
  | "auto"
  | "initial"
  | "inherit";

/* 
we can use this after upgrade to typescript 4

type StyledSizePx = `${number}px`
type StyledSizePercent = `${number}%`
export type StyledSize = StyledSizePx | StyledSizePercent | `calc(${string})`;
type Color = `#${string}` | `rgb(${number},${number},${number})` | `rgba(${number}, ${number}, ${number}, ${number})` | `hsl(${number}, ${number}%, ${number}%)` | `hsla(${number}, ${number}%, ${number}%, ${number}%)` | string;

type FlexGrow = number | "initial" | "inherit";
type FlexShrink = number | "initial" | "inherit";
type FlexBasis = StyledSize | "auto" | "initial" | "inherit";
type Flex = FlexGrow | FlexShrink | FlexBasis | `${FlexGrow} ${FlexShrink} ${FlexBasis}`;
 */
type OneKeyFrom<T, K extends keyof T = keyof T> = K extends any
  ? Pick<T, K> & Partial<Record<Exclude<keyof T, K>, never>> extends infer O
    ? { [P in keyof O]: O[P] }
    : never
  : never;

interface Column {
  col1?: boolean;
  col2?: boolean;
  col3?: boolean;
  col4?: boolean;
  col5?: boolean;
  col6?: boolean;
  col7?: boolean;
  col8?: boolean;
  col9?: boolean;
  col10?: boolean;
  col11?: boolean;
  col12?: boolean;
}

interface IBoxPropsBase {
  relative?: boolean;
  positionAbsolute?: boolean;
  static?: boolean;
  topRight?: boolean;
  displayInlineBlock?: boolean;
  rounded?: boolean;
  fullHeight?: boolean;
  fullWidth?: boolean;
  styledWidth?: string;
  styledHeight?: string;
  styledMinWidth?: string;
  styledMinHeight?: string;
  styledMaxHeight?: string;
  col?: boolean;
  verticalCenter?: boolean;
  centered?: boolean;
  justifyContentSpaceAround?: boolean;
  justifySpaceBetween?: boolean;
  left?: boolean;
  alignItemsFlexStart?: boolean;
  leftSelf?: boolean;
  right?: boolean;
  alignItemsFlexEnd?: boolean;
  rightSelf?: boolean;
  column?: boolean;
  wrap?: boolean;
  flex?: any;
  flexShrinkZero?: boolean;
  boxShadow?: boolean;
  charcoalGreyBg?: boolean;
  backgroundColor?: any;
  padded?: boolean;
  paddedRatio?: number;
  paddedHorizontally?: number | boolean;
  paddedVertically?: number | boolean;
  backgroundImage?: any;
  backgroundBlackOverlay?: number;
  wordBreak?: any;
  overflow?: Overflow;
  overflowY?: Overflow;
  scroll?: boolean;
  style?: any;
  as?: React.ElementType | keyof JSX.IntrinsicElements;
  ref?: any;
}
type IBoxProps = IBoxPropsBase & OneKeyFrom<Column>;

export const Box = styled.div<IBoxProps>`
  ${props => props.relative && `position:relative;`}

  display: flex;
  position: relative;
  ${props =>
    props.positionAbsolute &&
    `
    position:absolute;
    z-index:1;
   `}
  ${props => props.static && `position: static;`}
  ${props =>
    props.topRight &&
    `
    right: 0px;
    top: 0px;
  `}

  box-sizing: border-box;

  ${props => props.displayInlineBlock && `display: inline-block;`}

  ${props => props.rounded && `border-radius: ${props.theme.radiusLarge};`}

  ${props => props.fullHeight && `height: 100%;`}
  ${props => props.fullWidth && `width: 100%;`}
  ${props => props.styledWidth && `width: ${props.styledWidth};`}
  ${props => props.styledHeight && `height: ${props.styledHeight};`}
  ${props => props.styledMinWidth && `min-width: ${props.styledMinWidth};`}
  ${props => props.styledMinHeight && `min-height: ${props.styledMinHeight};`}
  ${props => props.styledMaxHeight && `max-height: ${props.styledMaxHeight};`}

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
  ${props => props.col5 && "width: 41.66667%;"}
  ${props => props.col6 && "width: 50%;"}
  // ${props => props.col7 && "width: 58.33333%;"}
  // ${props => props.col8 && "width: 66.66667%;"}
  // ${props => props.col9 && "width: 75%;"}
  ${props => props.col10 && "width: 83.33333%;"}
  ${props => props.col11 && "width: 91.66667%;"}
  // ${props => props.col12 && "width: 100%;"}

  ${props => props.verticalCenter && `align-items: center;`}
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

  ${props => props.flex && `flex: ${props.flex};`}
  ${props => props.flexShrinkZero && `flex-shrink: 0;`}

  ${props => props.boxShadow && `box-shadow: 0 2px 8px 0 rgba(0,0,0,0.16);`}

  /* Background colours? unsure how to handle this on theme level yet */
  ${props =>
    props.charcoalGreyBg && `background-color: ${props.theme.charcoalGrey};`}

  /* background color can be set on box or passed in through props read via theme...? */
  ${props =>
    props.backgroundColor && `background-color: ${props.backgroundColor};`}


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

  ${props =>
    props.backgroundImage &&
    `
      ${
        props.backgroundBlackOverlay
          ? `
      background-image: linear-gradient(
          rgba(0, 0, 0, ${props.backgroundBlackOverlay}),
          rgba(0, 0, 0, ${props.backgroundBlackOverlay})
        ),
        url(${props.backgroundImage});`
          : `background-image: url(${props.backgroundImage});`
      }
      background-size: cover;
      background-repeat: no-repeat;
      background-position: center;
    `}

  ${props => props.wordBreak && `word-break: ${props.wordBreak};`}
  ${props =>
    props.overflow &&
    `
      overflow: ${props.overflow};
    `}
  ${props =>
    props.overflowY &&
    `
      overflow-y: ${props.overflowY};
    `}

  ${props =>
    props.scroll &&
    `
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      width: 10px; /* for vertical scrollbars */
      height: 8px; /* for horizontal scrollbars */
    }

    &::-webkit-scrollbar-track {
      background: rgba(136,136,136,0.1);
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(136,136,136,0.6);
    }
  `}
`;

export const BoxSpan = styled(Box).attrs({
  as: "span"
})``;

export default Box;
