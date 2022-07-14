import React, { FC } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Box from "../../../../../../Styled/Box";
import { TextSpan } from "../../../../../../Styled/Text";

import { EmbedInput } from "./EmbedInput";

interface IEmbedSectionProps {
  shareUrl?: string;
}

export const EmbedSection: FC<IEmbedSectionProps> = ({ shareUrl }) => {
  const { t } = useTranslation();
  return (
    <Box column>
      <TextSpan medium>{t("share.embedTitle")}</TextSpan>
      <Explanation>{t("share.embedDescription")}</Explanation>
      <EmbedInput shareUrl={shareUrl} />
    </Box>
  );
};

const Explanation = styled(TextSpan)`
  opacity: 0.8;
`;
