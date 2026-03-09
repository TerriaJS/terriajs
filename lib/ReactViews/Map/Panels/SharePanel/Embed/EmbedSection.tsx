import { FC, useState } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";

import Box from "../../../../../Styled/Box";
import { RawButton } from "../../../../../Styled/Button";
import Icon, { StyledIcon } from "../../../../../Styled/Icon";
import { TextSpan } from "../../../../../Styled/Text";
import Spacing from "../../../../../Styled/Spacing";
import Clipboard from "../../../../Clipboard";

import { IShareUrlRef } from "../ShareUrl";

interface IEmbedSectionProps {
  shareUrl: IShareUrlRef | null;
}

export const EmbedSection: FC<IEmbedSectionProps> = ({ shareUrl }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const iframeCode =
    shareUrl?.url && shareUrl.url.length > 0
      ? `<iframe style="width: 720px; height: 600px; border: none;" src="${shareUrl.url}" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>`
      : "";

  return (
    <Box column>
      <RawButton onClick={() => setIsOpen((prev) => !prev)}>
        <Box
          css={`
            align-items: center;
            justify-content: space-between;
            width: 100%;
          `}
        >
          <TextSpan semiBold isLink medium>
            {t("share.embedTitle")}
          </TextSpan>
          <StyledIcon
            glyph={isOpen ? Icon.GLYPHS.opened : Icon.GLYPHS.closed}
            styledWidth="10px"
            light
          />
        </Box>
      </RawButton>
      {isOpen && (
        <>
          <Spacing bottom={1} />
          <Explanation>{t("share.embedDescription")}</Explanation>
          <Spacing bottom={1} />
          <Clipboard
            text={!shareUrl?.shorteningInProgress ? iframeCode : ""}
            inputPlaceholder={t("share.shortLinkShortening")}
          />
        </>
      )}
    </Box>
  );
};

const Explanation = styled(TextSpan)`
  opacity: 0.8;
`;
