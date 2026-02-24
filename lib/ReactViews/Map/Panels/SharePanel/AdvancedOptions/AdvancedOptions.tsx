import { FC, useState, MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Box from "../../../../../Styled/Box";
import { RawButton } from "../../../../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../../../../Styled/Icon";
import Spacing from "../../../../../Styled/Spacing";
import { TextSpan } from "../../../../../Styled/Text";
import { StyledHr } from "../StyledHr";
import Checkbox from "../../../../../Styled/Checkbox";

import { EmbedSection } from "./EmbedSection";
import { IShareUrlRef } from "../ShareUrl";

interface IAdvancedOptionsProps {
  canShortenUrl: boolean;
  shouldShorten: boolean;
  includeStoryInShare: boolean;
  includeStoryInShareOnChange: () => void;
  shouldShortenOnChange: () => void;
  shareUrl: MutableRefObject<IShareUrlRef | null>;
}

export const AdvancedOptions: FC<IAdvancedOptionsProps> = ({
  canShortenUrl,
  shouldShorten,
  includeStoryInShare,
  includeStoryInShareOnChange,
  shouldShortenOnChange,
  shareUrl
}) => {
  const { t } = useTranslation();

  return (
    <Box column gap={2}>
      {/* IncludeStoryCheckbox */}
      <Checkbox
        textProps={{ medium: true }}
        id="includeStory"
        title="Include Story in Share"
        isChecked={includeStoryInShare}
        onChange={includeStoryInShareOnChange}
      >
        <TextSpan>{t("includeStory.message")}</TextSpan>
      </Checkbox>
      {/* ShortenWithServiceCheckbox */}
      <Checkbox
        textProps={{ medium: true }}
        id="shortenUrl"
        isChecked={shouldShorten}
        onChange={shouldShortenOnChange}
        isDisabled={!canShortenUrl}
      >
        <TextSpan>{t("share.shortenUsingService")}</TextSpan>
      </Checkbox>
      <EmbedSection shareUrl={shareUrl?.current} />
    </Box>
  );
};
