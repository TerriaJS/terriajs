import { TFunction } from "i18next";
import React from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import { StyledIcon, GLYPHS } from "../Styled/Icon";
import { TextSpan } from "../Styled/Text";
import styled from "styled-components";
import Box from "../Styled/Box";

interface PropsType extends WithTranslation {
  message?: string;
  boxProps?: any;
  textProps?: any;
  t: TFunction;
  [spread: string]: any;
}
const Loader: React.FC<PropsType> = (props: PropsType) => {
  const { message, t, boxProps, textProps, ...rest }: PropsType = props;
  return (
    <Box fullWidth centered {...boxProps}>
      <AnimatedIcon
        glyph={GLYPHS.loader}
        styledWidth={"15px"}
        css={"margin: 5px"}
        {...rest}
      />
      <TextSpan {...textProps}>
        {message || t("loader.loadingMessage")}
      </TextSpan>
    </Box>
  );
};

const AnimatedIcon = styled(StyledIcon)`
  -webkit-animation: spin 2s infinite linear;
  animation: spin 2s infinite linear;

  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(359deg);
      transform: rotate(359deg);
    }
  }

  @keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(359deg);
      transform: rotate(359deg);
    }
  }
`;

export default withTranslation()(Loader);
