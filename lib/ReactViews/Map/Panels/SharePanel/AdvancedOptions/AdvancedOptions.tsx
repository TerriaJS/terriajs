import React, { FC, useState, MutableRefObject } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Box from "../../../../../Styled/Box";
import { RawButton } from "../../../../../Styled/Button";
import { GLYPHS, StyledIcon } from "../../../../../Styled/Icon";
import Spacing from "../../../../../Styled/Spacing";
import { TextSpan } from "../../../../../Styled/Text";
import { StyledHr } from "../StyledHr";

import { IncludeStoryCheckbox } from "./IncludeStoryCheckbox";
import { ShortenWithServiceCheckbox } from "./ShortenWithServiceCheckbox";
import { EmbedSection } from "./Embed";
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

  const [advancedOptions, setAdvancedOptions] = useState(false);

  const toogleAdvancedOptions = () => {
    setAdvancedOptions(prevState => !prevState);
  };

  return (
    <Box column>
      <RawButton
        onClick={toogleAdvancedOptions}
        css={`
          display: flex;
          align-items: center;
        `}
      >
        <TextSpan
          fullWidth
          medium
          css={`
            display: flex;
          `}
        >
          {t("share.btnAdvanced")}
        </TextSpan>
        {advancedOptions ? (
          <AdvanceOptionsIcon glyph={GLYPHS.opened} />
        ) : (
          <AdvanceOptionsIcon glyph={GLYPHS.closed} />
        )}
      </RawButton>

      {advancedOptions && (
        <>
          <StyledHr />
          <Box column>
            <IncludeStoryCheckbox
              includeStory={includeStoryInShare}
              onChange={includeStoryInShareOnChange}
            ></IncludeStoryCheckbox>
            <Spacing bottom={1} />
            <ShortenWithServiceCheckbox
              shouldShorten={shouldShorten}
              canShorten={canShortenUrl}
              onChange={shouldShortenOnChange}
            />
            <Spacing bottom={2} />
            <EmbedSection shareUrl={shareUrl?.current} />
          </Box>
        </>
      )}
    </Box>
  );
};

const AdvanceOptionsIcon = styled(StyledIcon).attrs({
  styledWidth: "10px",
  light: true
})``;
