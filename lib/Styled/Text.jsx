import styled from "styled-components";

// should it be a span or inline-block-div? - leaning to div
export const Text = styled.div`
  ${props => props.displayBlock && `display: block;`}

  // Unsure about this one, as we don't have react-router / "actual links" at
  // the moment, no present way to distinguish external links, etc
  ${props => props.isLink && `text-decoration: underline;`}

  // TODO: themeify family
  font-family: "Nunito", sans-serif;
  ${props => props.nunito && `font-family: "Nunito", sans-serif;`}
  // ${props => props.openSans && `font-family: "Nunito", sans-serif;`}

  ${props =>
    props.breakWord &&
    `
    overflow-wrap: break-word;
    word-wrap: break-word;
  `}

  font-weight: 400;
  ${props => props.light && `font-weight: 300;`}
  ${props => props.bold && `font-weight: bold;`}
  ${props => props.semiBold && `font-weight: 600;`}
  ${props => props.extraBold && `font-weight: 800;`}
  ${props => props.uppercase && `text-transform: uppercase;`}

  ${props => props.textAlignLeft && `text-align: left;`}
  ${props => props.textAlignCenter && `text-align: center;`}
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
  ${props =>
    props.textLightDimmed &&
    `
    color: ${props.theme.textLightDimmed};
  `}
  ${props =>
    props.textDark &&
    `
    color: ${props.theme.textDark};
  `}
  ${props =>
    props.textDarker &&
    `
    color: ${props.theme.textDarker};
  `}
  ${props =>
    props.color &&
    `
    color: ${props.color};
  `}

  ${props => props.fullWidth && `width: 100%;`}
  ${props => props.noWrap && `white-space: nowrap;`}

  ${props => !props.noFontSize && `font-size: 13px;`}
  line-height: 20px;

  ${props =>
    props.small &&
    `
    font-size: 12px;
  `}

  ${props =>
    props.medium &&
    `
    // terrace designed ~h4 equivalent?
    font-size: 14px;
  `}
  ${props =>
    props.large &&
    `
    font-size: 15px;
  `}
  ${props =>
    props.extraLarge &&
    `
    font-size: 16px;
  `}

  // yeah extra extra large - will re-port to h4 once we re-add Heading.tsx
  ${props =>
    props.extraExtraLarge &&
    `
    font-size: 18px;
  `}
  ${props =>
    props.subHeading &&
    `
    font-size: 23px;
    line-height: 31px;
  `}
  ${props =>
    props.heading &&
    `
    font-weight: 800;
    font-size: 26px;
    line-height: 32px;
  `}

  ${props => props.styledSize && `font-size: ${props.styledSize}`};
  ${props =>
    props.styledLineHeight && `line-height: ${props.styledLineHeight}`};
  
  ${props =>
    props.styledFontSize &&
    `
    font-size: ${props.styledFontSize};
  `}
  ${props =>
    props.styledLineHeight &&
    `
    line-height: ${props.styledLineHeight};
  `}
  
  ${props =>
    props.highlightLinks &&
    `
    a {
      color: ${props.theme.colorPrimary};
    }
  `}

  ${props => props.overflowHide && ` overflow: hidden;`}
  ${props => props.overflowEllipsis && ` text-overflow: ellipsis;`}

`;

export const TextSpan = styled(Text).attrs({
  as: "span"
})``;

export default Text;
