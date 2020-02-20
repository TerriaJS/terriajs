import styled from "styled-components";

// should it be a span or inline-block-div? - leaning to div
export const Text = styled.div`
  // TODO: themeify family
  font-family: "Nunito", "Open Sans", sans-serif;
  ${props => props.nunito && `font-family: "Nunito", "Open Sans", sans-serif;`}

  font-weight: 400;
  ${props => props.bold && `font-weight: bold;`}
  ${props => props.semiBold && `font-weight: 600;`}
  ${props => props.uppercase && `text-transform: uppercase;`}

  ${props => props.textAlignLeft && `text-align: left;`}
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

  font-size: 13px;
  line-height: 20px;

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
    props.title &&
    `
    font-weight: 800;
    font-size: 26px;
    line-height: 32px;
  `}
  
`;

export const TextSpan = styled(Text).attrs({
  as: "span"
})``;

export default Text;
