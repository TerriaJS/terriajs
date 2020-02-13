import styled from "styled-components";

// should it be a span or inline-block-div?
export const Text = styled.div`
  p {
    margin: 0;
  }
  p:not(:last-child) {
    margin-bottom: 8px;
  }

  display:inline;
  ${props => props.textAlignCenter && `text-align: center;`}
  ${props => props.displayBlock && `display: block;`}

  ${props => props.fullHeight && `height: 100%;`}
  ${props => props.fullWidth && `width: 100%;`}
  
  color: #4d5766;
  ${props => props.lightGrey && `color: #7C8592;`}
  ${props =>
    props.white &&
    `
    color: #fff;
  `}
  font-family: Nunito;

  font-weight: 400;
  ${props => props.bold && `font-weight: bold;`}
  ${props => props.semiBold && `font-weight: 600;`}
  ${props => props.tallerHeight && `line-height: 24px;`}

  // ~h4 equivalent?
  font-size: 14px;
  line-height: 20px;

  // ~h3 equivalent?
  ${props =>
    props.medium &&
    `
      font-size: 16px;
      line-height: 22px;
    `}

  // ~h2 equivalent?
  ${props =>
    props.large &&
    `
      font-size: 24px;
      line-height: 20px;
    `}

  ${props =>
    props.truncate &&
    `
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
    `}

  // ~h1 equivalent? should never use this size without <Heading />
  ${props =>
    props.titleStyle &&
    `
      font-size: 32px;
      line-height: 38px;
    `}

  ${props => !props.skinny && `margin: 0 4px 0 0;`}
  ${props => props.marginBottom && `margin-bottom: ${4 * props.marginBottom}px`}

`;

export default Text;
