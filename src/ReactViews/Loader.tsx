import { TFunction } from "i18next";
import React from "react";
import { useTranslation } from "react-i18next";
import Box from "../Styled/Box";
import { TextSpan } from "../Styled/Text";
import AnimatedSpinnerIcon from "../Styled/AnimatedSpinnerIcon";

export interface PropsType {
  message?: string;
  boxProps?: any;
  textProps?: any;
  [spread: string]: any;
}
const Loader: React.FC<PropsType> = (props: PropsType) => {
  const { t } = useTranslation();
  const { message, boxProps, textProps, ...rest }: PropsType = props;
  return (
    <Box fullWidth centered {...boxProps}>
      <AnimatedSpinnerIcon styledWidth={"15px"} css={"margin: 5px"} {...rest} />
      <TextSpan {...textProps}>
        {message || t("loader.loadingMessage")}
      </TextSpan>
    </Box>
  );
};

export default Loader;
